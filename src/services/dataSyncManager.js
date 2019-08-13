import { Toast } from 'antd-mobile';
import {
  agsQueryForIds,
  agsQueryForRecords,
  queryDicts,
  queryAdminAreas,
  queryDepts,
  queryCsUnits,
  syncSpots,
  syncProjects,
  syncCsUnits,
  // syncPhotoPoints,
  syncLabelPoints,
  queryProjectsApi,
  querySpotsApi,
  queryPointsApi,
} from './httpApi';
import {
  emptySpots,
  addSpotsBatch,
  emptyProjects,
  addProjectsBatch,
  emptyDicts,
  addDictsBatch,
  emptyAdminAreas,
  addAdminAreasBatch,
  emptyDepts,
  addDeptsBatch,
  emptyCsUnits,
  addCsUnitsBatch,
  emptyPhotoPoints,
  addPhotoPointsBatch,
  emptyLabelPoints,
  addLabelPointsBatch,

  // 查询图斑更新情况
  queryUpdateSpots,

  // 查询项目修改情况
  queryAddProjects,
  queryUpdateProjects,

  // 查询建设单位修改情况
  queryAddCsUnits,
  queryUpdateCsUnits,

  // 查询照片点修改情况
  queryAddPhotoPoints,
  queryUpdatePhotoPoints,
  queryDeletePhotoPoints,

  // 查询标注点修改情况
  queryAddLabelPoints,
  queryUpdateLabelPoints,
  queryDeleteLabelPoints,
} from './localApi';
import config from '../config';
import {
  getRegionCondition,
  getUpdateRecords,
  toDateTimeFormatObj,
  toDateDayFormatObj,
  dateStrToNumber,
  agsDateNumberToNumber,
} from '../utils/util';

// 是否正在处理
let isProcessing = false;

// 用户
let user = {};

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
async function process(currentUser) {
  if (!isProcessing) {
    isProcessing = true;
    user = currentUser;

    try {
      await processSpots(0, 20);
      await processProjects(20, 40);
      await processCsUnits(40, 55);
      await processLabelPoints(55, 70);
      // await processPhotoPoints(45, 60);
      await onDownloadDepts();
      percentCallback(80);
      await onDownloadDicts();
      percentCallback(90);
      await onDownloadAdminAreas();
      percentCallback(100);
    } catch (e) {
      console.log('同步中断err:', e);

      // 中断后调用回调函数，改变状态
      completedCallback();

      isProcessing = false;
    }
    // 完成后调用回调函数
    completedCallback();

    isProcessing = false;
  }
}

// --------------------------------------------------------------------------------
// 处理图斑
async function processSpots(fromPercent, toPercent) {
  const eachPartPercent = (toPercent - fromPercent) / 2;

  // 同步图斑
  const result = await onSyncSpots();
  percentCallback(Math.round(fromPercent + eachPartPercent));

  if (result.err) {
    // 网络失败
    Toast.fail('同步图斑失败！', 1);
    console.log('同步图斑失败！');
  } else {
    const {
      data: { state },
    } = result;
    if (state) {
      // 同步成功
      await onDownloadSpots(fromPercent + eachPartPercent, toPercent);
    } else {
      // 同步失败
      Toast.fail('同步图斑失败！', 1);
      console.log('同步图斑失败！');
    }
  }
}

// 同步图斑
async function onSyncSpots() {
  const items = await queryUpdateSpots();
  // console.log('同步图斑items', items);
  // const newItems = getUpdateRecords(items, 'ID');
  const newItems = items.filter(item => item._v !== 1);
  // console.log('同步图斑newItems', newItems);
  const updateRecords = newItems.map(newItem => {
    const { SHAPE, ...rest } = newItem;
    return {
      attributes: {
        ...rest,
        ...toDateTimeFormatObj(rest, 'CTIME'),
        ...toDateTimeFormatObj(rest, 'DTIME'),
        ...toDateTimeFormatObj(rest, 'OTIME'),
      },
    };
  });
  // const records = JSON.stringify({ updateRecords });
  const result = await syncSpots({ updateRecords });
  console.log('同步图斑params', { updateRecords });
  console.log('同步图斑response', result);

  return result;
}

// 下载图斑
async function onDownloadSpots(fromPercent, toPercent) {
  await emptySpots();
  const { data: records } = await querySpotsApi();
  const newRecords = records.map(record => {
    return {
      ...record,
      ctime: dateStrToNumber(record.ctime),
      dtime: dateStrToNumber(record.dtime),
      otime: dateStrToNumber(record.otime),
    };
  });
  await addSpotsBatch({ records: newRecords });
  percentCallback(toPercent);

  // await myQuery(
  //   config.spotLayerUrl,
  //   getRegionCondition(user, 'XZQDM'),
  //   (doneCount, totalCount, records) => {
  //     const newRecords = records.map(record => {
  //       return {
  //         attributes: {
  //           ...record.attributes,
  //           CTIME: agsDateNumberToNumber(record.attributes.CTIME),
  //           DTIME: agsDateNumberToNumber(record.attributes.DTIME),
  //           OTIME: agsDateNumberToNumber(record.attributes.OTIME),
  //         },
  //         geometry: record.geometry,
  //       };
  //     });

  //     // 批量添加图斑
  //     addSpotsBatch({ records: newRecords });

  //     // 调用进度回调函数
  //     const percent = Math.round(fromPercent + (doneCount * eachPartPercent) / totalCount);
  //     percentCallback(percent);
  //   }
  // );
}

// --------------------------------------------------------------------------------
// 处理项目
async function processProjects(fromPercent, toPercent) {
  const eachPartPercent = (toPercent - fromPercent) / 2;

  // 同步项目
  const result = await onSyncProjects();
  percentCallback(Math.round(fromPercent + eachPartPercent));

  if (result.err) {
    // 网络失败
    Toast.fail('同步项目失败！', 1);
    console.log('同步项目失败！');
  } else {
    const {
      data: { state },
    } = result;
    if (state) {
      // 同步成功
      await onDownloadProjects(fromPercent + eachPartPercent, toPercent);
    } else {
      // 同步失败
      Toast.fail('同步项目失败！', 1);
      console.log('同步项目失败！');
    }
  }
}

// 同步项目
async function onSyncProjects() {
  // 查询更新的项目
  const items = await queryUpdateProjects();
  // console.log('同步项目items', items);
  // const newItems = getUpdateRecords(items, 'SWC_P_ID');
  const newItems = items.filter(item => item._v !== 1);
  // console.log('同步项目newItems', newItems);
  const updateRecords = newItems.map(newItem => {
    const { SHAPE, ...rest } = newItem;
    return {
      attributes: {
        ...rest,
        ...toDateDayFormatObj(rest, 'RP_TIME'),
        ...toDateTimeFormatObj(rest, 'C_TIME'),
        ...toDateTimeFormatObj(rest, 'M_TIME'),
      },
    };
  });

  // 查询新增的项目
  const addItems = await queryAddProjects();
  const addRecords = addItems.map(addItem => {
    const { _v, SHAPE, ...rest } = addItem;
    return {
      attributes: {
        ...rest,
        ...toDateDayFormatObj(rest, 'RP_TIME'),
        ...toDateTimeFormatObj(rest, 'C_TIME'),
        ...toDateTimeFormatObj(rest, 'M_TIME'),
      },
    };
  });

  const result = await syncProjects({ addRecords, updateRecords });
  console.log('同步项目params', { addRecords, updateRecords });
  console.log('同步项目response', result);

  return result;
}

// 下载项目
async function onDownloadProjects(fromPercent, toPercent) {
  await emptyProjects();
  const { data: records } = await queryProjectsApi();
  const newRecords = records.map(record => {
    return {
      ...record,
      rp_time: dateStrToNumber(record.rp_time),
      c_time: dateStrToNumber(record.c_time),
      m_time: dateStrToNumber(record.m_time),
    };
  });
  await addProjectsBatch({ records: newRecords });
  percentCallback(toPercent);

  // // （1）查询有图形项目
  // await myQuery(
  //   config.projectLayerUrl,
  //   [`(${getRegionCondition(user, 'NJHT_DB.SWC_PROJECT_INFO.IVV_CNTY')})`].join(' and '),
  //   (doneCount, totalCount, records) => {
  //     const newRecords = records.map(record => {
  //       return {
  //         attributes: {
  //           SWC_P_ID: record.attributes['NJHT_DB.SWC_PROJECT_INFO.SWC_P_ID'],
  //           VEC_TYPE: record.attributes['NJHT_DB.SWC_PROJECT_INFO.VEC_TYPE'],
  //           PRO_NAME: record.attributes['NJHT_DB.SWC_PROJECT_INFO.PRO_NAME'],
  //           XMHGX: record.attributes['NJHT_DB.SWC_PROJECT_INFO.XMHGX'],
  //           CS_UNIT_ID: record.attributes['NJHT_DB.SWC_PROJECT_INFO.CS_UNIT_ID'],
  //           RP_AGNT_ID: record.attributes['NJHT_DB.SWC_PROJECT_INFO.RP_AGNT_ID'],
  //           PRO_LEVEL: record.attributes['NJHT_DB.SWC_PROJECT_INFO.PRO_LEVEL'],
  //           RP_NUM: record.attributes['NJHT_DB.SWC_PROJECT_INFO.RP_NUM'],
  //           RP_TIME: agsDateNumberToNumber(record.attributes['NJHT_DB.SWC_PROJECT_INFO.RP_TIME']),
  //           PRO_TYPE: record.attributes['NJHT_DB.SWC_PROJECT_INFO.PRO_TYPE'],
  //           PRO_CATE: record.attributes['NJHT_DB.SWC_PROJECT_INFO.PRO_CATE'],
  //           PRO_NAT: record.attributes['NJHT_DB.SWC_PROJECT_INFO.PRO_NAT'],
  //           CST_STATE: record.attributes['NJHT_DB.SWC_PROJECT_INFO.CST_STATE'],
  //           IPT_UNIT: record.attributes['NJHT_DB.SWC_PROJECT_INFO.IPT_UNIT'],
  //           SUP_UNIT: record.attributes['NJHT_DB.SWC_PROJECT_INFO.SUP_UNIT'],
  //           IVV_CNTY: record.attributes['NJHT_DB.SWC_PROJECT_INFO.IVV_CNTY'],
  //           C_PERSON: record.attributes['NJHT_DB.SWC_PROJECT_INFO.C_PERSON'],
  //           C_TIME: agsDateNumberToNumber(record.attributes['NJHT_DB.SWC_PROJECT_INFO.C_TIME']),
  //           M_PERSON: record.attributes['NJHT_DB.SWC_PROJECT_INFO.M_PERSON'],
  //           M_TIME: agsDateNumberToNumber(record.attributes['NJHT_DB.SWC_PROJECT_INFO.M_TIME']),
  //           DATA_STATE: record.attributes['NJHT_DB.SWC_PROJECT_INFO.DATA_STATE'],
  //           MDID: record.attributes['NJHT_MAP.PRO_SCOPE.MDID'],
  //           MEMO: record.attributes['NJHT_DB.SWC_PROJECT_INFO.MEMO'],
  //         },
  //         geometry: record.geometry,
  //       };
  //     });

  //     // 批量添加项目
  //     addProjectsBatch({ records: newRecords });

  //     // 调用进度回调函数
  //     const percent = Math.round(fromPercent + (doneCount * eachPartPercent) / totalCount);
  //     percentCallback(percent);
  //   }
  // );

  // // （2）查询无图形项目
  // const { data: records } = await queryProjects({
  //   where: [`(${getRegionCondition(user, 'IVV_CNTY')})`, 'TXID is null'].join(' and '),
  // });
  // const newRecords = records.map(record => {
  //   return {
  //     attributes: {
  //       ...record,
  //       RP_TIME: dateStrToNumber(record.RP_TIME),
  //       C_TIME: dateStrToNumber(record.C_TIME),
  //       M_TIME: dateStrToNumber(record.M_TIME),
  //     },
  //     geometry: null,
  //   };
  // });

  // // 批量添加项目
  // await addProjectsBatch({ records: newRecords });
}

// --------------------------------------------------------------------------------
// 处理建设单位
async function processCsUnits(fromPercent, toPercent) {
  const eachPartPercent = (toPercent - fromPercent) / 2;

  // 同步建设单位
  const result = await onSyncCsUnits();
  percentCallback(Math.round(fromPercent + eachPartPercent));

  if (result.err) {
    // 网络失败
    Toast.fail('同步建设单位失败！', 1);
    console.log('同步建设单位失败！');
  } else {
    const {
      data: { state },
    } = result;
    if (state) {
      // 同步成功
      await onDownloadCsUnits(fromPercent + eachPartPercent, toPercent);
    } else {
      // 同步失败
      Toast.fail('同步建设单位失败！', 1);
      console.log('同步建设单位失败！');
    }
  }
}

// 同步建设单位
async function onSyncCsUnits() {
  // 查询更新的建设单位
  const items = await queryUpdateCsUnits();
  // console.log('同步建设单位items', items);
  // const newItems = getUpdateRecords(items, 'ID');
  const newItems = items.filter(item => item._v !== 1);
  // console.log('同步建设单位newItems', newItems);
  const updateRecords = newItems.map(newItem => {
    const { ...rest } = newItem;
    return {
      attributes: {
        ...rest,
        ...toDateTimeFormatObj(rest, 'C_TIME'),
        ...toDateTimeFormatObj(rest, 'M_TIME'),
      },
    };
  });

  // 查询新增的建设单位
  const addItems = await queryAddCsUnits();
  const addRecords = addItems.map(addItem => {
    const { _v, ...rest } = addItem;
    return {
      attributes: {
        ...rest,
        ...toDateTimeFormatObj(rest, 'C_TIME'),
        ...toDateTimeFormatObj(rest, 'M_TIME'),
      },
    };
  });

  // const records = JSON.stringify({ addRecords, updateRecords });
  const result = await syncCsUnits({ addRecords, updateRecords });
  console.log('同步建设单位params', { addRecords, updateRecords });
  console.log('同步建设单位response', result);

  return result;
}

// 下载单位表
async function onDownloadCsUnits(fromPercent, toPercent) {
  // 清除单位表
  await emptyCsUnits();

  // 查询单位
  const { data: records } = await queryCsUnits();

  const newRecords = records.map(record => {
    return {
      ...record,
      C_TIME: dateStrToNumber(record.C_TIME),
      M_TIME: dateStrToNumber(record.M_TIME),
    };
  });

  // 批量添加单位
  await addCsUnitsBatch({ records: newRecords });

  // 调用进度回调函数
  percentCallback(toPercent);
}

// --------------------------------------------------------------------------------
// 处理照片点
// async function processPhotoPoints(fromPercent, toPercent) {
//   const eachPartPercent = (toPercent - fromPercent) / 2;

//   // 同步照片点
//   const result = await onSyncPhotoPoints();
//   percentCallback(Math.round(fromPercent + eachPartPercent));

//   if (result.err) {
//     // 网络失败
//     Toast.fail('同步照片点失败！', 1);
//   } else {
//     const {
//       data: { state },
//     } = result;
//     if (state) {
//       // 同步成功
//       await onDownloadPhotoPoints(fromPercent + eachPartPercent, toPercent);
//     } else {
//       // 同步失败
//       Toast.fail('同步照片点失败！', 1);
//     }
//   }
// }

// 同步照片点
// async function onSyncPhotoPoints() {
//   // 新增
//   const addItems = await queryAddPhotoPoints();
//   const addRecords = addItems.map(addItem => {
//     const { _v, SHAPE, ...rest } = addItem;
//     return {
//       attributes: {
//         ...rest,
//         ...toDateTimeFormatObj(rest, 'CTIME'),
//         ...toDateTimeFormatObj(rest, 'DTIME'),
//         ...toDateTimeFormatObj(rest, 'OTIME'),
//       },
//       geometry: JSON.parse(SHAPE),
//     };
//   });

//   // 更新
//   const items = await queryUpdatePhotoPoints();
//   const newItems = getUpdateRecords(items, 'ID');
//   const updateRecords = newItems.map(newItem => {
//     const { SHAPE, ...rest } = newItem;
//     return {
//       attributes: {
//         ...rest,
//         ...toDateTimeFormatObj(rest, 'CTIME'),
//         ...toDateTimeFormatObj(rest, 'DTIME'),
//         ...toDateTimeFormatObj(rest, 'OTIME'),
//       },
//     };
//   });

//   // 删除
//   const deleteRecords = await queryDeletePhotoPoints();

//   const records = JSON.stringify({ addRecords, updateRecords, deleteRecords });
//   const result = await syncPhotoPoints({ records });
//   console.log('同步照片点', result);

//   return result;
// }

// 下载照片点
// async function onDownloadPhotoPoints(fromPercent, toPercent) {
//   const eachPartPercent = toPercent - fromPercent;

//   // 清除照片点表
//   await emptyPhotoPoints();

//   // 查询照片点
//   await myQuery(
//     config.photoPointLayerUrl,
//     `MDID='${user.dwid}'`,
//     (doneCount, totalCount, records) => {
//       const newRecords = records.map(record => {
//         return {
//           attributes: {
//             ...record.attributes,
//             CTIME: agsDateNumberToNumber(record.attributes.CTIME),
//             DTIME: agsDateNumberToNumber(record.attributes.DTIME),
//             OTIME: agsDateNumberToNumber(record.attributes.OTIME),
//           },
//           geometry: record.geometry,
//         };
//       });

//       // 批量添加照片点
//       addPhotoPointsBatch({ records: newRecords });

//       // 调用进度回调函数
//       const percent = Math.round(fromPercent + (doneCount * eachPartPercent) / totalCount);
//       percentCallback(percent);
//     }
//   );
// }

// --------------------------------------------------------------------------------
// 处理标注点
async function processLabelPoints(fromPercent, toPercent) {
  const eachPartPercent = (toPercent - fromPercent) / 2;

  // 同步标注点
  const result = await onSyncLabelPoints();
  percentCallback(Math.round(fromPercent + eachPartPercent));

  if (result.err) {
    // 网络失败
    Toast.fail('同步标注点失败！', 1);
    console.log('同步标注点失败！');
  } else {
    const {
      data: { state },
    } = result;
    if (state) {
      // 同步成功
      await onDownloadLabelPoints(fromPercent + eachPartPercent, toPercent);
    } else {
      // 同步失败
      Toast.fail('同步标注点失败！', 1);
      console.log('同步标注点失败！');
    }
  }
}

// 同步标注点
async function onSyncLabelPoints() {
  // 新增;
  const addItems = await queryAddLabelPoints();
  const addRecords = addItems.map(addItem => {
    const { _v, SHAPE, ...rest } = addItem;
    return {
      attributes: {
        ...rest,
        ...toDateTimeFormatObj(rest, 'CTIME'),
        ...toDateTimeFormatObj(rest, 'DTIME'),
        ...toDateTimeFormatObj(rest, 'OTIME'),
      },
      geometry: SHAPE,
    };
  });

  // 更新
  const items = await queryUpdateLabelPoints();
  // console.log('同步标注点items', items);
  // const newItems = getUpdateRecords(items, 'ID');
  const newItems = items.filter(item => item._v !== 1);
  // console.log('同步标注点newItems', newItems);
  const updateRecords = newItems.map(newItem => {
    const { SHAPE, ...rest } = newItem;
    return {
      attributes: {
        ...rest,
        ...toDateTimeFormatObj(rest, 'CTIME'),
        ...toDateTimeFormatObj(rest, 'DTIME'),
        ...toDateTimeFormatObj(rest, 'OTIME'),
      },
      geometry: SHAPE,
    };
  });

  // 删除
  const deleteRecords = await queryDeleteLabelPoints();

  // const records = JSON.stringify({ addRecords, updateRecords, deleteRecords });
  const result = await syncLabelPoints({ addRecords, updateRecords, deleteRecords });
  console.log('同步标注点params', { addRecords, updateRecords, deleteRecords });
  console.log('同步标注点response', result);

  return result;
}

// 下载标注点
async function onDownloadLabelPoints(fromPercent, toPercent) {
  await emptyLabelPoints();
  const { data: records } = await queryPointsApi();
  const newRecords = records.map(record => {
    return {
      ...record,
      ctime: dateStrToNumber(record.ctime),
      dtime: dateStrToNumber(record.dtime),
      otime: dateStrToNumber(record.otime),
    };
  });
  await addLabelPointsBatch({ records: newRecords });
  percentCallback(toPercent);

  // // 查询标注点
  // await myQuery(
  //   config.labelPointLayerUrl,
  //   `MDID='${user.dwid}'`,
  //   (doneCount, totalCount, records) => {
  //     const newRecords = records.map(record => {
  //       return {
  //         attributes: {
  //           ...record.attributes,
  //           CTIME: agsDateNumberToNumber(record.attributes.CTIME),
  //           DTIME: agsDateNumberToNumber(record.attributes.DTIME),
  //           OTIME: agsDateNumberToNumber(record.attributes.OTIME),
  //         },
  //         geometry: record.geometry,
  //       };
  //     });

  //     // 批量添加标注点
  //     addLabelPointsBatch({ records: newRecords });

  //     // 调用进度回调函数
  //     const percent = Math.round(fromPercent + (doneCount * eachPartPercent) / totalCount);
  //     percentCallback(percent);
  //   }
  // );
}

// --------------------------------------------------------------------------------
// 下载部门表
async function onDownloadDepts() {
  // 清除部门表
  await emptyDepts();

  // 查询部门
  const { data: records } = await queryDepts();

  // 批量添加部门
  await addDeptsBatch({ records });
}

// --------------------------------------------------------------------------------
// 下载数据字典
async function onDownloadDicts() {
  // 清除字典表
  await emptyDicts();

  // 查询字典
  const { data: records } = await queryDicts();
  // console.log('响应值-字典列表', records);

  // 批量添加字典
  await addDictsBatch({ records: records });
}

// --------------------------------------------------------------------------------
// 下载行政区划表
async function onDownloadAdminAreas() {
  // 清除行政区划表
  await emptyAdminAreas();

  // 查询行政区划
  const { data: records } = await queryAdminAreas();
  // console.log('响应值-行政区划列表', records);

  // 批量添加行政区划
  await addAdminAreasBatch({ records });
}

// --------------------------------------------------------------------------------
// 分页查询记录
async function myQuery(url, where, callback, requestCount = 100) {
  // 查询地址
  const queryUrl = `${url}/query`;

  // 查询图层记录id数组
  let {
    data: { objectIds },
  } = await agsQueryForIds({
    url: queryUrl,
    params: {
      where,
    },
  });

  if (!objectIds) {
    objectIds = [];
  }

  // 总记录数
  const totalCount = objectIds.length;

  // 分页获取记录
  await myQueryForRecords(0);

  // 分页获取记录函数
  async function myQueryForRecords(i) {
    if (i < totalCount) {
      const requestObjectIds = objectIds.slice(i, i + requestCount);

      // 根据id数组查询记录
      const {
        data: { features: records },
      } = await agsQueryForRecords({
        url: queryUrl,
        params: {
          objectIds: requestObjectIds,
          outFields: '*',
        },
      });

      if (callback) {
        // 已下载的记录数
        const doneCount = i + records.length;

        // 回调函数
        callback(doneCount, totalCount, records);
      }

      // 分页获取记录
      await myQueryForRecords(i + requestCount);
    }
  }
}

export { setProcessCallback, process };
