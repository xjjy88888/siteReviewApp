import {
  addAttachmentsBatch,
  queryDeleteAttachmentsById,
  deleteAttachments,
  revertAddOrUpdateAttachments,
  queryAddAttachmentsById,
  emptySpotAttachmentsById,
} from './localApi';
import { queryAttachments, syncAttachments } from './httpApi';
import {
  ROOT_DIR_PATH,
  resolveLocalFileSystemURL,
  getDirectory,
  getFile,
  downloadFile,
  getBase64,
} from '../utils/fileUtil';

// 是否正在处理
let isProcessing = false;

// 用户
let user = {};

// 是否仅同步本地修改
let isOnlySyncLocalEdit = true;

// 进度管理器
const percentManager = {
  doneCount: 0,
  totalCount: 0,
  reset() {
    this.doneCount = 0;
    this.totalCount = 0;
  },
  perform() {
    this.doneCount += 1;
    const percent = Math.round((this.doneCount * 100) / this.totalCount);
    percentCallback(percent);
  },
};

// 处理进度回调函数
let percentCallback = () => {};

// 处理完成回调函数
let completedCallback = () => {};

// 设置处理回调函数
function setProcessCallback(percentCallbackFn, completedCallbackFn) {
  percentCallback = percentCallbackFn;
  completedCallback = completedCallbackFn;
}

// 处理
async function process(currentUser, theIsOnlySyncLocalEdit, id) {
  if (!isProcessing) {
    isProcessing = true;
    user = currentUser;
    isOnlySyncLocalEdit = theIsOnlySyncLocalEdit;
    percentManager.reset();

    // 处理附件
    await processAttachments(id);

    // 进度设为完成
    percentCallback(100);

    // 完成后调用回调函数
    completedCallback();

    isProcessing = false;
  }
}

// --------------------------------------------------------------------------------
// 处理附件
async function processAttachments(id) {
  // 同步所有要删除附件
  await onDeleteAttachments(id);

  // 获取要新增的附件
  const addItems = await queryAddAttachmentsById(id);

  // 获取要下载的附件
  let downloadItems = [];
  if (!isOnlySyncLocalEdit) {
    // 获取本地未同步至云端前，云端附件信息
    downloadItems = await getCurrentAttachmentsDownloadInfos(id);
  }

  // 获取要同步的总数
  percentManager.totalCount = addItems.length + downloadItems.length;

  // 同步所有要新增的附件
  await onAddAttachments(addItems);

  if (!isOnlySyncLocalEdit) {
    // 清除图斑相关附件
    await emptySpotAttachmentsById(id);

    // 获取本地同步至云端后附件信息
    downloadItems = await getCurrentAttachmentsDownloadInfos(id);

    // 下载附件
    await onDownloadAttachments(downloadItems);
  }
}

// 获取云端附件信息
async function getCurrentAttachmentsDownloadInfos(id) {
  const [result1] = [await getAttachmentsDownloadInfos(id, 'spot', 'spot')];

  return [...result1];
}

// 同步所有要删除附件
async function onDeleteAttachments(id) {
  // 获取图斑相关删除附件记录
  const deleteItems = await queryDeleteAttachmentsById(id);
  const deleteRecords = deleteItems.map(item => {
    return {
      ID: item.ID,
      DPID: user.userId,
    };
  });
  // const records = JSON.stringify({ deleteRecords });
  const result = await syncAttachments({ deleteRecords });
  if (result.err) {
    const msg = `同步删除文件失败！${result.err}`;
    console.error(msg);
    throw new Error(msg);
  } else {
    const {
      data: { state },
    } = result;
    if (state) {
      // 同步成功，删除这些记录
      const ids = deleteItems.map(item => {
        return item.ID;
      });
      await deleteAttachments({ ids });
    } else {
      const msg = `同步删除文件失败！`;
      console.error(msg);
      throw new Error(msg);
    }
  }
}

// 同步所有要新增的附件
async function onAddAttachments(results) {
  await request();
  async function request() {
    if (results.length > 0) {
      // 从数组中取出下载并移除
      const item = results.shift();
      await onAddAttachment.apply(this, [item]);

      // 调用进度回调函数
      percentManager.perform();

      // 下载下一个
      await request();
    }
  }
}

// 同步单个新增附件
async function onAddAttachment(addItem) {
  const { _v, PATH, ...rest } = addItem;
  const fileEntry = await resolveLocalFileSystemURL(PATH);
  const { code, fileName } = await getBase64(fileEntry);
  const addRecords = [
    {
      ...rest,
      FILE: code,
      FILE_NAME: fileName,
      USER_ID: user.userId,
      USER_NAME: user.userName,
    },
  ];
  // const records = JSON.stringify({ addRecords });
  const result = await syncAttachments({ addRecords });
  if (result.err) {
    console.error(`同步新增文件失败！${result.err}`);
  } else {
    const {
      data: { state },
    } = result;
    if (state) {
      // 同步成功
      await revertAddOrUpdateAttachments({ id: addItem.ID });
    } else {
      console.error(`同步新增文件失败！`);
    }
  }
}

// 下载附件
async function onDownloadAttachments(results) {
  await request();
  async function request() {
    if (results.length > 0) {
      // 从数组中取出下载并移除
      const arr = results.shift();
      await onDownloadAttachment.apply(this, arr);

      // 调用进度回调函数
      percentManager.perform();

      // 下载下一个
      await request();
    }
  }
}

// 获取在线附件的下载信息（查询id函数，下载目录，来源）
async function getAttachmentsDownloadInfos(id, dirName, source) {
  // 获取在线附件数量
  const { data: items } = await queryAttachments({ id: id, soucre: dirName });

  // 获取附件下载的目录
  const [rootDirPath, userDirName, parentDirName] = [ROOT_DIR_PATH, user.userName, dirName];
  const rootDirEntry = await resolveLocalFileSystemURL(rootDirPath);
  const userDirEntry = await getDirectory(rootDirEntry, userDirName);
  const parentDirEntry = await getDirectory(userDirEntry, parentDirName);

  // 遍历每个关联对象，将下载参数放入数组
  const results = [];
  for (const key in items) {
    if ({}.hasOwnProperty.call(items, key)) {
      // 遍历关联对象下的每个附件
      for (const record of items[key]) {
        const sourceUrl = record.PATH;
        const suffix = sourceUrl.substring(sourceUrl.lastIndexOf('.'));
        const fileName = `${record.ID}${suffix}`;
        results.push([sourceUrl, parentDirEntry, fileName, { ...record, SOURCE: source }]);
      }
    }
  }

  return results;
}

// 下载单个附件
async function onDownloadAttachment(sourceUrl, parentDirEntry, fileName, record) {
  const filePath = `${parentDirEntry.nativeURL}/${fileName}`;
  console.log(`Download ${sourceUrl}. Write ${fileName}`);

  // 下载单个附件
  const fileEntry = await getFile(parentDirEntry, fileName);
  await downloadFile(sourceUrl, fileEntry, fileName);

  // 添加附件
  await addAttachmentsBatch({
    records: [
      {
        ...record,
        PATH: filePath,
      },
    ],
  });
}

export { setProcessCallback, process };
