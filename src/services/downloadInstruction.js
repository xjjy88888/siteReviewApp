// import { getInstruction } from './httpApi';
import { addInstructionBatch, emptyInstruction } from './localApi';
import { guid } from './localApi/sqliteApi/common';
import config from '../config';

// 是否正在处理
let isProcessing = false;

// 处理进度回调函数
let percentCallback = () => {};

// 处理完成回调函数
let completedCallback = () => {};

// 设置处理回调函数
function setInstructionProcessCallback(percentCallbackFn, completedCallbackFn) {
  percentCallback = percentCallbackFn;
  completedCallback = completedCallbackFn;
}

// 处理
async function InstructionProcess() {
  if (!isProcessing) {
    isProcessing = true;

    // const Instruction = await getInstruction();
    const Instruction = [config.instructionUrl];

    await emptyInstruction();

    await downloadInstruction(Instruction, 0, 100);
  }

  // 完成后调用回调函数
  completedCallback();

  isProcessing = false;
}

// ---------------------------------------------------------
// 按进度一条一条下载使用说明
async function downloadInstruction(records, fromPercent, toPercent) {
  const eachPartPercent = toPercent - fromPercent;
  // 封装好的所有使用说明信息
  const results = await encapsulationInstruction(records);
  // 下载附件
  let doneCount = 0;
  const totalCount = results.length;
  let percent;
  await request();
  async function request() {
    if (totalCount > 0) {
      // 从数组中取出下载并移除
      const arr = results.shift();
      await onDownloadInstruction.apply(this, arr);

      // 调用进度回调函数
      doneCount += 1;
      percent = Math.round(fromPercent + (doneCount * eachPartPercent) / totalCount);
      percentCallback(percent);
      if (percent !== toPercent) {
        // 下载下一个
        await request();
      } else {
        return 'end';
      }
    }
  }
}

// 封装使用说明信息
async function encapsulationInstruction(records) {
  const results = [];
  if (records.length !== 0) {
    const InstructionRecords = records.map(record => {
      return {
        ID: guid(),
        FILE_NAME: record.substring(record.lastIndexOf('/') + 1),
        TYPE: record.substring(record.lastIndexOf('.') + 1),
        PATH: record,
      };
    });
    const result = await reconstructionInstruction(InstructionRecords, '使用说明');
    Array.prototype.push.apply(results, result);
  }
  return results;
}

// 重构使用说明信息
async function reconstructionInstruction(records, str) {
  const results = [];
  records.map(record => {
    const sourceUrl = record.PATH;
    const entryName = str;
    const fileName = record.FILE_NAME;
    const filePath = { entryName };
    results.push([sourceUrl, fileName, filePath, record]);
    return results;
  });
  return results;
}

// 下载单个使用说明
async function onDownloadInstruction(sourceUrl, fileName, filePath, record) {
  console.log(`Download ${sourceUrl}. Write ${fileName}`);

  // 下载附件
  await downloadFile(sourceUrl, fileName, filePath);

  // 添加使用说明
  await addInstructionBatch({
    records: [
      {
        ...record,
        // eslint-disable-next-line
        PATH: `${cordova.file.externalDataDirectory}/${filePath.entryName}/${fileName}`,
      },
    ],
  });
}

//-----------------------------------------------------------------
// 下载文件
async function downloadFile(sourceUrl, fileName, filePath) {
  /* eslint-disable */
  return new Promise((resolve, reject) => {
    window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, fs => {
      fs.getDirectory(
        `${filePath.entryName}`,
        { create: true },
        function(path) {
          // createFile(thirdPath, "fileInNewSubDir.txt");
          path.getFile(
            fileName,
            { create: true, exclusive: false },
            fileEntry => {
              const oReq = new XMLHttpRequest();
              // Make sure you add the domain name to the Content-Security-Policy <meta> element.
              oReq.open('GET', sourceUrl, true);
              // Define how you want the XHR data to come back
              oReq.responseType = 'blob';
              oReq.onload = function(oEvent) {
                if (oReq.status === 200) {
                  const blob = oReq.response;
                  // 创建一个写入对象
                  fileEntry.createWriter(fileWriter => {
                    // 文件写入成功
                    fileWriter.onwriteend = function() {
                      console.log(`Successful get ${sourceUrl}. Successful write ${fileName}`);
                      resolve();
                    };

                    // 文件写入失败
                    fileWriter.onerror = function(e) {
                      console.log(
                        `Successful get ${sourceUrl}. Failed write ${fileName}: ${e.toString()}`
                      );
                      reject(e.toString());
                    };

                    // 写入文件
                    fileWriter.write(blob);
                  });
                } else {
                  resolve();
                  console.log(`Failed get ${sourceUrl}`);
                }
              };
              oReq.send(null);
            },
            err => {
              console.error(`error getting file! ${err}`);
            }
          );
        },
        onErrorGetPath => {
          console.log(`onErrorGetFirstPath : ${onErrorGetPath}`);
        }
      );
    });
  });
  /* eslint-enable */
}

export { setInstructionProcessCallback, InstructionProcess };
