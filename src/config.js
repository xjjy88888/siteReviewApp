const isBeta = false;

const myOnlineImageUrl =
  "http://www.stbcjg.cn/BasemapService/rest/image/latest/tile/{z}/{y}/{x}";
const arcgisVectorUrl =
  "http://cache1.arcgisonline.cn/arcgis/rest/services/ChinaOnlineCommunity/MapServer/tile/{z}/{y}/{x}";
const arcgisImageUrl =
  "https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const tdtVectorUrl =
"http://t{s}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=7786923a385369346d56b966bb6ad62f";
const tdtImageUrl =
"http://t{s}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=7786923a385369346d56b966bb6ad62f";
const tdtImageLabelUrl =
  "http://t{s}.tianditu.gov.cn/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=7786923a385369346d56b966bb6ad62f";
// "http://t{s}.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=7786923a385369346d56b966bb6ad62f";
const googleVectorUrl =
"http://www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}";
const googleImageUrl =
"http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}";
const gaodeVectorUrl =
"http://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}";
const gaodeImageUrl =
"http://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}";
// const bdVectorUrl =
//   'http://online{s}.map.bdimg.com/onlinelabel/?qt=tile&x={x}&y={y}&z={z}&styles={styles}&scaler=1&p=1';
// const bdImageUrl =
//   'http://shangetu{s}.map.bdimg.com/it/u=x={x};y={y};z={z};v=009;type=sate&fm=46';
const OSMVectorUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const errorTileUrl = "./img/errorTileUrl.png";
//行政边界-区县
const districtBoundUrl = `${
  isBeta
    ? "http://183.6.178.124:8143/geoserver/ZKYGIS"
    : "https://www.zkygis.cn:8143/geoserver/ZKYGIS"
  }`;

const domain = isBeta ? `http://183.6.178.124:8001/stbct/` : `https://www.zkygis.cn/stbc/`;

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
    // url: myOnlineImageUrl,
    url:'http://www.stbcjg.cn/BasemapService/rest/image/latest',
    minZoom: 0,
    maxZoom: 21,
    folder: 'cache',
    name: 'myImageLayer',
    debug: false,
    subdomains: "abc",
    picUrl: `./img/myOnlineImage.png`,
    errorTileUrl: errorTileUrl,
  },

  //天地图影像注记
  tdtImageLabel: {
    title: "路网注记",
    url: tdtImageLabelUrl,
    minZoom: 0,
    maxZoom: 21,
    subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
    picUrl: `./img/tdtImagelabel.png`,
    errorTileUrl: errorTileUrl,
  },

  //行政边界
  districtBound: {
    title: "行政边界",
    url: districtBoundUrl,
    mapDistrictLayerName: isBeta
      ? "ZKYGIS:district_code_t"
      : "ZKYGIS:district_code",
    minZoom: 0,
    maxZoom: 21,
    picUrl: `./img/districtBound.png`,
    errorTileUrl: errorTileUrl,
  },

  // 在线底图
  onlineBasemaps: [
    {
      title: "监管影像图",
      url: myOnlineImageUrl,
      minZoom: 0,
      maxZoom: 21,
      subdomains: "abc",
      picUrl: `./img/myOnlineImage.png`,
      errorTileUrl: errorTileUrl,
    },
    {
      title: "OSM街道图",
      url: OSMVectorUrl,
      minZoom: 0,
      maxZoom: 21,
      subdomains: "abc",
      picUrl: `./img/OSMVector.png`,
      errorTileUrl: errorTileUrl,
    },
    {
      title: "ArcGIS影像图",
      url: arcgisImageUrl,
      minZoom: 0,
      maxZoom: 21,
      subdomains: "abc",
      picUrl: `./img/arcgisImage.png`,
      errorTileUrl: errorTileUrl,
    },
    {
      title: "ArcGIS街道图(有偏移)",
      url: arcgisVectorUrl,
      minZoom: 0,
      maxZoom: 21,
      subdomains: "abc",
      picUrl: `./img/arcgisVector.png`,
      errorTileUrl: errorTileUrl,
    },
    {
      title: "天地影像图",
      url: tdtImageUrl,
      minZoom: 0,
      maxZoom: 21,
      subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
      picUrl: `./img/tdtImage.png`,
      errorTileUrl: errorTileUrl,
    },
    {
      title: "天地街道图",
      url: tdtVectorUrl,
      minZoom: 0,
      maxZoom: 21,
      subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
      picUrl: `./img/tdtVector.png`,
      errorTileUrl: errorTileUrl,
    },
    {
      title: "谷歌影像图(有偏移)",
      url: googleImageUrl,
      minZoom: 0,
      maxZoom: 21,
      subdomains: "abc",
      picUrl: `./img/googleImage.png`,
      errorTileUrl: errorTileUrl,
    },
    {
      title: "谷歌街道图(有偏移)",
      url: googleVectorUrl,
      minZoom: 0,
      maxZoom: 21,
      subdomains: "abc",
      picUrl: `./img/googleVector.png`,
      errorTileUrl: errorTileUrl,
    },
    {
      title: "高德影像图(有偏移)",
      url: gaodeImageUrl,
      minZoom: 0,
      maxZoom: 21,
      subdomains: ["1", "2", "3", "4"],
      picUrl: `./img/gaodeImage.png`,
      errorTileUrl: errorTileUrl,
    },
    {
      title: "高德街道图(有偏移)",
      url: gaodeVectorUrl,
      minZoom: 0,
      maxZoom: 21,
      subdomains: ["1", "2", "3", "4"],
      picUrl: `./img/gaodeVector.png`,
      errorTileUrl: errorTileUrl,
    }
    // {
    //   title: '百度街道图',
    //   url: bdVectorUrl,
    //   minZoom: 0,
    //   maxZoom: 21,
    // },
    // {
    //   title: '百度影像图',
    //   url: bdImageUrl,
    //   minZoom: 0,
    //   maxZoom: 21,
    // },
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

  // 版本
  versionUrl: `http://183.6.178.124:8001/apk/version.json`,

  // 下载app
  downloadApkUrl: `http://183.6.178.124:8001/apk/siteReview${isBeta ? '_beta' : ''}.apk`,

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
