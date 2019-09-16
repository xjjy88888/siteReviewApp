import CryptoJS from 'crypto-js';
import request, { agsRequest } from '../utils/request';
import config from '../config';
import { dateFormat, accessToken } from '../utils/util';
import jQuery from 'jquery';

// 版本
export async function versionApi() {
  return new Promise((resolve, reject) => {
    jQuery.ajax({
      url: config.versionUrl,
      cache: false,
      success: v => {
        resolve(v);
      },
      error: v => {
        reject(v);
      },
    });
  });
}

// 登录
// export async function login(params) {
//   console.log('登录参数LogOn', params);
//   const { username, password } = params;
// const passwordMd5 = CryptoJS.MD5(password).toString();
//   return request(`${config.loginUrl}?userName=${username}&password=${password}`, {
//     method: 'GET',
//   });
// }
export async function login(params) {
  const passwordMd5 = CryptoJS.MD5(params.password).toString();
  return request(config.loginUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ ...params, password: passwordMd5 }),
  });
}

// 查询图层记录总数
export async function agsQueryForCount({ url, params }) {
  const defaultParams = {
    where: '1=1',
    f: 'json',
    returnCountOnly: true,
  };
  const newParams = { ...defaultParams, ...params };
  console.log('查询图层记录总数参数' + url, newParams);
  return agsRequest(url, {
    body: newParams,
  });
}

// 查询图层记录id数组
export async function agsQueryForIds({ url, params }) {
  const defaultParams = {
    where: '1=1',
    f: 'json',
    returnIdsOnly: true,
  };
  const newParams = { ...defaultParams, ...params };
  console.log('查询图层记录id数组参数' + url, newParams);
  return agsRequest(url, {
    body: newParams,
  });
}

// 根据id数组查询记录
export async function agsQueryForRecords({ url, params }) {
  const defaultParams = {
    f: 'json',
    objectIds: [-1],
  };
  const newParams = { ...defaultParams, ...params };
  newParams.objectIds = newParams.objectIds.join(',');
  console.log('根据id数组查询记录参数' + url, newParams);
  return agsRequest(url, {
    body: newParams,
  });
}

// 项目列表
export async function queryProjectsApi(onlyCount) {
  const p = localStorage.getItem('preserve');
  return request(`${config.projectsUrl}?onlyCount=${onlyCount ? true : false}&preserve=${p}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken()}`,
    },
  });
}
// 图斑列表
export async function querySpotsApi(onlyCount) {
  const p = localStorage.getItem('preserve');
  return request(`${config.spotsUrl}?onlyCount=${onlyCount ? true : false}&preserve=${p}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken()}`,
    },
  });
}
// 标注点列表
export async function queryPointsApi(onlyCount) {
  const p = localStorage.getItem('preserve');
  return request(`${config.pointsUrl}?onlyCount=${onlyCount ? true : false}&preserve=${p}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken()}`,
    },
  });
}

// 查询字典
export async function queryDicts(onlyCount) {
  return request(`${config.dictsUrl}?onlyCount=${onlyCount ? true : false}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken()}`,
    },
  });
}

// 查询行政区划
export async function queryAdminAreas(onlyCount) {
  return request(`${config.adminAreasUrl}?onlyCount=${onlyCount ? true : false}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken()}`,
    },
  });
}

// 查询部门
export async function queryDepts(onlyCount) {
  return request(`${config.deptsUrl}?onlyCount=${onlyCount ? true : false}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken()}`,
    },
  });
}

// 查询建设单位
export async function queryCsUnits(onlyCount) {
  return request(`${config.csUnitUrl}?onlyCount=${onlyCount ? true : false}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken()}`,
    },
  });
}

// 查询建设单位
// export async function queryCsUnits() {
//   return request(`http://www.stbcjg.cn:8080/MobileOperate/GetCsUnitList`, {
//     method: 'GET',
//   });
// }

// 获取使用说明
// export async function getInstruction() {
//   return request(`${config.instructionUrl}`, {
//     method: 'GET',
//     headers: {
//       Authorization: `Bearer ${accessToken()}`,
//     },
//   });
// }

// 查询附件
export async function queryAttachments(params) {
  return request(`${config.attachsUrl}?soucre=${params.soucre}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      'Content-Type': 'application/json-patch+json',
    },
    body: JSON.stringify(params.id.split(',')),
  });
}

// 同步图斑
export async function syncSpots(params) {
  // console.log('同步图斑参数UpdateSpot', params);
  return request(`${config.spotSyncUrl}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${accessToken()}`,
    },
    body: JSON.stringify(params),
  });
}

// 同步项目
export async function syncProjects(params) {
  // console.log('同步项目参数UpdatePro', params);
  return request(`${config.projectSyncUrl}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${accessToken()}`,
    },
    body: JSON.stringify(params),
  });
}

// 同步建设单位
export async function syncCsUnits(params) {
  // console.log('同步建设单位参数UpdateCsUnit', params);
  return request(`${config.csUnitSyncUrl}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${accessToken()}`,
    },
    body: JSON.stringify(params),
  });
}

// 同步照片点
// export async function syncPhotoPoints(params) {
//   console.log('照片点同步参数UpdatePicMarkPoint', params);
//   return request(`${config.photoPointsSyncUrl}`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json; charset=utf-8',
//       Authorization: `Bearer ${accessToken()}`,
//     },
//     body: JSON.stringify(params),
//   });
// }

// 同步标注点
export async function syncLabelPoints(params) {
  // console.log('同步标注点UpdateMarkPoint', params);
  return request(`${config.labelPointsSyncUrl}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${accessToken()}`,
    },
    body: JSON.stringify(params),
  });
}

// 同步附件
export async function syncAttachments(params) {
  // console.log('附件同步接口参数UpdateFiles', params);
  return request(`${config.attachSyncUrl}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${accessToken()}`,
    },
    body: JSON.stringify(params),
  });
}
