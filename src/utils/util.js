import moment from 'moment';
import coordtransform from 'coordtransform';
import bigInt from 'big-integer';

// const guid = () => {
//   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
//     const r = (Math.random() * 16) | 0;
//     const v = c === 'x' ? r : (r & 0x3) | 0x8;
//     return v.toString(16);
//   });
// };

const guid = () => {
  const Snowflake = /** @class */ (function() {
    function Snowflake(_workerId, _dataCenterId, _sequence) {
      // this.twepoch = 1288834974657;
      this.twepoch = 0;
      this.workerIdBits = 5;
      this.dataCenterIdBits = 5;
      this.maxWrokerId = -1 ^ (-1 << this.workerIdBits); // 值为：31
      this.maxDataCenterId = -1 ^ (-1 << this.dataCenterIdBits); // 值为：31
      this.sequenceBits = 12;
      this.workerIdShift = this.sequenceBits; // 值为：12
      this.dataCenterIdShift = this.sequenceBits + this.workerIdBits; // 值为：17
      this.timestampLeftShift = this.sequenceBits + this.workerIdBits + this.dataCenterIdBits; // 值为：22
      this.sequenceMask = -1 ^ (-1 << this.sequenceBits); // 值为：4095
      this.lastTimestamp = -1;
      //设置默认值,从环境变量取
      this.workerId = 1;
      this.dataCenterId = 1;
      this.sequence = 0;
      if (this.workerId > this.maxWrokerId || this.workerId < 0) {
        throw new Error(
          'config.worker_id must max than 0 and small than maxWrokerId-[' + this.maxWrokerId + ']'
        );
      }
      if (this.dataCenterId > this.maxDataCenterId || this.dataCenterId < 0) {
        throw new Error(
          'config.data_center_id must max than 0 and small than maxDataCenterId-[' +
            this.maxDataCenterId +
            ']'
        );
      }
      this.workerId = _workerId;
      this.dataCenterId = _dataCenterId;
      this.sequence = _sequence;
    }
    Snowflake.prototype.tilNextMillis = function(lastTimestamp) {
      var timestamp = this.timeGen();
      while (timestamp <= lastTimestamp) {
        timestamp = this.timeGen();
      }
      return timestamp;
    };
    Snowflake.prototype.timeGen = function() {
      //new Date().getTime() === Date.now()
      return Date.now();
    };
    Snowflake.prototype.nextId = function() {
      var timestamp = this.timeGen();
      if (timestamp < this.lastTimestamp) {
        throw new Error(
          'Clock moved backwards. Refusing to generate id for ' + (this.lastTimestamp - timestamp)
        );
      }
      if (this.lastTimestamp === timestamp) {
        this.sequence = (this.sequence + 1) & this.sequenceMask;
        if (this.sequence === 0) {
          timestamp = this.tilNextMillis(this.lastTimestamp);
        }
      } else {
        this.sequence = 0;
      }
      this.lastTimestamp = timestamp;
      var shiftNum =
        (this.dataCenterId << this.dataCenterIdShift) |
        (this.workerId << this.workerIdShift) |
        this.sequence; // dataCenterId:1,workerId:1,sequence:0  shiftNum:135168
      var nfirst = new bigInt(String(timestamp - this.twepoch), 10);
      nfirst = nfirst.shiftLeft(this.timestampLeftShift);
      var nnextId = nfirst.or(new bigInt(String(shiftNum), 10)).toString(10);
      return nnextId;
    };
    return Snowflake;
  })();

  return new Snowflake(1, 1, 0).nextId();
};

// 获取区域条件
const getRegionCondition = (user, regionFieldName) => {
  let result = '1=1';
  let { regionArea, dwdm } = user;

  if (typeof regionArea === 'string' && regionArea.trim() !== '') {
    // 流域机构
    regionArea = regionArea.trim();
    result = regionArea
      .split(',')
      .map(item => {
        const v = item.trim();
        return `${regionFieldName} like '${v}%' or ${regionFieldName} like '%,${v}%'`;
      })
      .join(' or ');
  } else if (typeof dwdm === 'string' && dwdm.trim() !== '') {
    // 省市县
    dwdm = dwdm.trim();

    // 默认为县
    let v = dwdm;
    const lastFour = dwdm.substr(dwdm.length - 4);
    const lastTwo = dwdm.substr(dwdm.length - 2);
    if (lastFour === '0000') {
      // 省
      v = dwdm.substr(0, 2);
    } else if (lastTwo === '00') {
      // 市
      v = dwdm.substr(0, 4);
    }
    result = `${regionFieldName} like '${v}%' or ${regionFieldName} like '%,${v}%'`;
  }

  return result;
};

// 仅获取修改字段的记录
const getUpdateRecords = (items, pkFieldName) => {
  const result = [];
  for (let i = 0; i < items.length; i += 2) {
    const item1 = items[i];
    const item2 = items[i + 1];
    const record = {};
    for (const key in item2) {
      if ({}.hasOwnProperty.call(item1, key)) {
        // eslint-disable-next-line
        if (key !== '_v' && item1[key] != item2[key]) {
          record[key] = item2[key];
        }
      }
    }

    if (JSON.stringify(record) !== '{}') {
      record[pkFieldName] = item2[pkFieldName];
      result.push(record);
    }
  }

  return result;
};

// 转为格式化后的字符串
const toDateTimeFormatStr = value => {
  return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : '';
};

// 转为格式化后的时间对象
const toDateTimeFormatObj = (obj, key) => {
  const result = {};
  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    const value = obj[key];
    result[key] = value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
  }

  return result;
};

// 转为格式化后的日期对象
const toDateDayFormatObj = (obj, key) => {
  const result = {};
  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    const value = obj[key];
    result[key] = value ? moment(value).format('YYYY-MM-DD') : null;
  }

  return result;
};

// 日期字符串转为数值型
const dateStrToNumber = str => {
  let result = null;
  if (str) {
    // 将T转为空格，防止时区引发时间不正确
    result = new Date(str.replace('T', ' ')).getTime();
  }
  return result;
};

// arcgis server时间转为数值型
const agsDateNumberToNumber = n => {
  let result = null;
  if (n) {
    // arcgis server时间去掉8小时，防止时区引发时间不正确
    result = new Date(n - 8 * 60 * 60 * 1000).getTime();
  }
  return result;
};

// 四舍五入
const round = (number, decimal) => {
  const times = 10 ** decimal;
  return Math.round(number * times) / times;
};

// 向上舍入
const ceil = (number, decimal) => {
  const times = 10 ** decimal;
  return Math.ceil(number * times) / times;
};

// 向下舍入
const floor = (number, decimal) => {
  const times = 10 ** decimal;
  return Math.floor(number * times) / times;
};

// 国测局坐标转wgs84经纬度
const gcj02toWgs84LatLng = latlng => {
  // 国测局坐标转wgs84坐标
  const gcj02towgs84 = coordtransform.gcj02towgs84(latlng.lng, latlng.lat);

  // eslint-disable-next-line
  return L.latLng(gcj02towgs84[1], gcj02towgs84[0]);
};

// 百度坐标系转wgs84经纬度
const bd09toWgs84LatLng = latlng => {
  // 百度经纬度坐标转国测局坐标
  const bd09togcj02 = coordtransform.bd09togcj02(latlng.lng, latlng.lat);

  // 国测局坐标转wgs84坐标
  const gcj02towgs84 = coordtransform.gcj02towgs84(bd09togcj02[0], bd09togcj02[1]);

  // eslint-disable-next-line
  return L.latLng(gcj02towgs84[1], gcj02towgs84[0]);
};

// wgs84经纬度转百度坐标系
const wgs84toBd09LatLng = latlng => {
  // wgs84坐标转国测局坐标
  const wgs84togcj02 = coordtransform.wgs84togcj02(latlng.lng, latlng.lat);

  // 国测局坐标转百度经纬度
  const gcj02tobd09 = coordtransform.gcj02tobd09(wgs84togcj02[0], wgs84togcj02[1]);

  // eslint-disable-next-line
  return L.latLng(gcj02tobd09[1], gcj02tobd09[0]);
};

// 获取当前位置
// export async function getCurrentPosition() {
//   return new Promise((resolve, reject) => {
//     if (navigator.geolocation) {
//       console.log("打开位置");
//       navigator.geolocation.getCurrentPosition(
//         res => {
//           console.log("定位成功：", res);
//           resolve(res.coords);
//         },
//         error => {
//           console.log("定位失败：", error);
//           resolve({});
//         }
//       );
//     } else {
//       console.log("未打开位置");
//       resolve({});
//     }
//   });
// }

export async function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line
    baidumap_location.getCurrentPosition(
      result => {
        console.log(JSON.stringify(result, null, 4));
        resolve(result);
      },
      error => {
        console.log(JSON.stringify(error, null, 4));
        reject(error);
      }
    );
  });
}

// 转化为树结构
const toTreeData = data => {
  function tree(value) {
    const arr = [];
    data
      .filter(item => {
        return item.PID === value;
      })
      .forEach(item => {
        arr.push({
          ...item,
          children: tree(item.value),
        });
      });
    return arr;
  }
  return tree('0'); // 第一级节点的父id，是null或者0，视情况传入
};

// 给选择项添加checked属性
export async function addChecked(data, value) {
  const area = data;
  if (typeof value === 'string' && value.trim() !== '') {
    const result = value.split(',');
    data.map((item, i) => {
      result.map(rItem => {
        if (item.value === rItem) {
          area.splice(i, 1, { ...item, checked: true });
        }
        return item;
      });
      return item;
    });
  }
  return area;
}

// 打开文件类型
const mimeTypes = fileType => {
  const arry = [
    { type: 'docx', appType: 'application/msword' },
    { type: 'doc', appType: 'application/msword' },
    { type: 'pdf', appType: 'application/pdf' },
    { type: 'zip', appType: 'application/zip' },
    { type: 'rar', appType: 'application/rar' },
    { type: 'jpeg', appType: 'image/jpeg' },
    { type: 'jpg', appType: 'image/jpeg' },
    { type: 'png', appType: 'image/png' },
    { type: 'apk', appType: 'application/vnd.android.package-archive' },
  ];
  const mime = arry.filter(item => item.type === fileType);
  if (mime.length > 0) {
    return mime[0].appType;
  } else {
    return null;
  }
};

// 将xyz信息转为对象
const xyzToObjects = xyz => {
  const arr = (xyz || '').split(',');
  if (arr.length === 4) {
    return {
      listIndex: parseInt(arr[0], 0),
      x: parseInt(arr[1], 0),
      y: parseInt(arr[2], 0),
      index: parseInt(arr[3], 0),
    };
  } else {
    return {};
  }
};

const accessToken = () =>
  localStorage.length > 0 && localStorage.user ? JSON.parse(localStorage.user).accessToken : '';

export {
  guid,
  getRegionCondition,
  getUpdateRecords,
  toDateTimeFormatStr,
  toDateTimeFormatObj,
  toDateDayFormatObj,
  dateStrToNumber,
  agsDateNumberToNumber,
  round,
  ceil,
  floor,
  gcj02toWgs84LatLng,
  bd09toWgs84LatLng,
  wgs84toBd09LatLng,
  toTreeData,
  mimeTypes,
  xyzToObjects,
  accessToken,
};
