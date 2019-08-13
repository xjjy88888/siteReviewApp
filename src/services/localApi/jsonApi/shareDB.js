// 初始化数据库
export async function initShareDB() {
  // json api，无需实现
}

// 关闭数据库
export async function closeShareDB() {
  // json api，无需实现
}

//-----------------------------------------------------------------------------------------------------
// 登录
export async function login() {
  // json api，无需实现
}

// 保存用户信息
export async function saveUserInfo() {
  // json api，无需实现
}

//-----------------------------------------------------------------------------------------------------
// 查询瓦片下载信息列表
export async function queryTileDownloadInfos() {
  return [
    {
      id: '1',
      name: 'a2018-06-02',
      bbox: '113.26758384704591,23.399456529685423,113.43237876892091,23.440569039771567',
      createTime: '2018-06-02',
      isFinished: 0,
      xyz: '1,2,3',
      percent: 20,
      isPaused: 0,
    },
    {
      id: '2',
      name: 'b2018-06-02',
      bbox: '113.26758384704591,23.399456529685423,113.43237876892091,23.440569039771567',
      createTime: '2018-06-02',
      isFinished: 0,
      xyz: '1,2,3',
      percent: 90,
      isPaused: 1,
    },
    {
      id: '3',
      name: 'c2018-06-02',
      bbox: '113.26758384704591,23.399456529685423,113.43237876892091,23.440569039771567',
      createTime: '2018-06-02',
      isFinished: 1,
      xyz: '1,2,3',
      percent: 100,
      isPaused: 0,
    },
    {
      id: '4',
      name: 'd2018-06-02',
      bbox: '113.26758384704591,23.399456529685423,113.43237876892091,23.440569039771567',
      createTime: '2018-06-02',
      isFinished: 1,
      xyz: '1,2,3',
      percent: 100,
      isPaused: 0,
    },
    {
      id: '5',
      name: 'e2018-06-02',
      bbox: '113.26758384704591,23.399456529685423,113.43237876892091,23.440569039771567',
      createTime: '2018-06-02',
      isFinished: 0,
      xyz: '1,2,3',
      percent: 20,
      isPaused: 0,
    },
  ];
}

// 查询瓦片下载信息是否已存在
export async function isTileDownloadInfoExist() {
  return false;
}

// 添加瓦片下载信息
export async function addTileDownloadInfo() {
  return null;
}

// 更新瓦片下载信息
export async function updateTileDownloadInfo() {
  return null;
}

// 删除瓦片下载信息、同时将其添加至瓦片删除信息中
export async function removeTileDownloadInfo() {
  return null;
}

// 查询瓦片删除信息列表
export async function queryTileDeleteInfos() {
  return [
    {
      id: '6',
      name: 'a2018-06-02',
      bbox: '113.26758384704591,23.399456529685423,113.43237876892091,23.440569039771567',
      deleteTime: '2018-06-02',
      xyz: '1,2,3',
      percent: 20,
    },
  ];
}

// 更新瓦片删除信息
export async function updateTileDeleteInfo() {
  return null;
}

// 删除瓦片删除信息
export async function removeTileDeleteInfo() {
  return null;
}

export async function getAllAdminArea() {
  return [
    {
      label: 'a1',
      value: '440101',
    },
    {
      label: 'a2',
      value: '440105',
    },
    {
      label: 'a3',
      value: '440106',
    },
    {
      label: 'a4',
      value: '440114',
    },
  ];
}

export async function queryDBProjectById() {
  return [
    {
      PRO_NAME: 'a1',
      SWC_P_ID: '',
    },
  ];
}

export async function queryDBProjectsByName() {
  return [
    {
      PRO_NAME: '',
      SWC_P_ID: '',
    },
  ];
}

export async function queryDBCsUnitById() {
  return [
    {
      DP_NAME: '',
      ID: '',
    },
  ];
}

export async function queryDBCsUnitsByName() {
  return [
    {
      DP_NAME: '',
      ID: '',
    },
  ];
}
export async function queryDBDeptById() {
  return [
    {
      newName: '',
      DP_ID: '',
    },
  ];
}

export async function queryDBDepts() {
  return [
    {
      newName: '',
      DP_ID: '',
    },
  ];
}

export async function queryRelationSpotsById() {
  return [];
}
