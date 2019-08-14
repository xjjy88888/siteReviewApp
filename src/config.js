const myOnlineImageUrl = 'http://www.stbcjg.cn/BasemapService/rest/image/latest';
const arcgisVectorUrl =
  'http://cache1.arcgisonline.cn/arcgis/rest/services/ChinaOnlineCommunity/MapServer';
const arcgisImageUrl =
  'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer';

  // const domain = `https://www.zkygis.cn/stbc/`;//正式
const domain = `http://183.6.178.124:8001/stbct/`; //测试

const config = {
  domain: domain,

  // 地图默认值
  mapDefault: {
    // // 纬度、经度 广州
    center: [23.42, 113.35],
    // 纬度、经度 全国
    //center: [33.2846, 106.6992],
    zoom: 10,
    minZoom: 14,
    maxZoom: 20,
  },

  // 显示点状要素的级别
  pointClusterLevel: 13,

  // 从属性表定位要素的级别
  locateFeatureLevel: 14,

  // 下载离线影像的级别
  downloadLevels: [0, 18],

  // 离线底图
  offlineBasemap: {
    title: '监管影像（离线）',
    url: myOnlineImageUrl,
    minZoom: 0,
    maxZoom: 20,
    folder: 'cache',
    name: 'myImageLayer',
    debug: false,
  },

  // 在线底图
  onlineBasemaps: [
    {
      title: '监管影像（在线）',
      url: myOnlineImageUrl,
      minZoom: 0,
      maxZoom: 20,
    },
    {
      title: '地形（在线，有偏移）',
      url: arcgisVectorUrl,
      minZoom: 0,
      maxZoom: 18,
    },
    {
      title: '影像（在线）',
      url: arcgisImageUrl,
      minZoom: 0,
      maxZoom: 18,
    },
  ],

  // 下载影像的参考在线底图
  downloadTileOnlineBasemaps: [
    {
      title: '监管影像（在线）',
      url: myOnlineImageUrl,
      minZoom: 11,
      maxZoom: 18,
    },
    {
      title: '地形（在线，有偏移）',
      url: arcgisVectorUrl,
      minZoom: 11,
      maxZoom: 18,
    },
  ],

  // 登录
  loginUrl: `${domain}api/TokenAuth/Authenticate`,

  // 字典地址
  dictsUrl: `${domain}api/MobileOperate/GetDicts`,

  // 行政区划地址
  adminAreasUrl: `${domain}api/MobileOperate/GetXZQHDM`,

  // 部门地址
  deptsUrl: `${domain}api/MobileOperate/GetDepartmentList`,

  // 建设单位地址
  csUnitUrl: `${domain}api/MobileOperate/GetCsUnitList`,

  // 项目列表
  projectsUrl: `${domain}api/MobileOperate/GetProjectList`,

  // 图斑列表
  spotsUrl: `${domain}api/MobileOperate/GetSpotList`,

  // 标注点列表
  pointsUrl: `${domain}api/MobileOperate/GetMarkPointList`,

  // 项目同步接口
  projectSyncUrl: `${domain}api/MobileOperate/UpdatePro`,

  // 建设单位同步地址
  csUnitSyncUrl: `${domain}api/MobileOperate/UpdateCsUnit`,

  // 标注点同步地址
  labelPointsSyncUrl: `${domain}api/MobileOperate/UpdateMarkPoint`,

  // 图斑同步接口
  spotSyncUrl: `${domain}api/MobileOperate/UpdateSpot`,

  // 附件接口
  attachsUrl: `${domain}api/MobileOperate/GetFiles`,

  // 附件同步接口
  attachSyncUrl: `${domain}api/MobileOperate/UpdateFiles`,

  // 附件查看
  attachInfoUrl: `${domain}api/services/app/File/GetFile?id=`,

  // 使用说明接口
  instructionUrl: 'https://www.zkygis.cn/stbcjg/Template/使用说明/区域监管使用说明.docx',

  // 图斑图层地址
  // spotLayerUrl: 'http://www.stbcjg.cn:6080/arcgis/rest/services/STBC/STBCMap/MapServer/1',

  // 项目图层地址
  // projectLayerUrl: 'http://www.stbcjg.cn:6080/arcgis/rest/services/STBC/STBCMapMobile/MapServer/0',

  // 标注点图层地址
  // labelPointLayerUrl: 'http://www.stbcjg.cn:6080/arcgis/rest/services/STBC/STBCMap/MapServer/11',

  // 照片点图层地址
  // photoPointLayerUrl: 'http://www.stbcjg.cn:6080/arcgis/rest/services/STBC/STBCMap/MapServer/12',

  // 照片点同步地址
  // photoPointsSyncUrl: 'http://www.stbcjg.cn:8080/MobileOperate/UpdatePicMarkPoint',

  //矢量瓦片扰动图斑数据源接口
  // spotGeoJsonUrl: 'http://aj.zkygis.cn/stbcSys/mapfile/spot.json',

  //矢量瓦片项目红线数据源接口
  // projectGeoJsonUrl: 'http://aj.zkygis.cn/stbcSys/mapfile/project.json',
};

export default config;
