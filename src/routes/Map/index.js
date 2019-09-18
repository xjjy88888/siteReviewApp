import React from 'react';
import { Toast, NavBar, ActivityIndicator, Modal } from 'antd-mobile';
import { connect } from 'dva';
import { withRouter } from 'dva/router';
import L from 'leaflet';
// import Util from 'esri-leaflet/src/Util';
import 'proj4leaflet';
import 'leaflet.vectorgrid'; //矢量瓦片
// import 'leaflet.vectorgrid/dist/Leaflet.VectorGrid.bundled.js'; //矢量瓦片
import 'leaflet-easybutton';
import 'leaflet.markercluster';
import 'Leaflet.Deflate';
import 'beautifymarker/leaflet-beautify-marker-icon';
import 'leaflet.pm';
import 'leaflet.pm/dist/leaflet.pm.css';
import 'leaflet-bookmarks';
import 'leaflet-bookmarks/dist/leaflet.bookmarks.css';
import 'leaflet-rotatedmarker';
import * as turf from '@turf/turf';
import jQuery from 'jquery';
import labelPointMarkerImageUrl from '@/assets/labelPointMarker.png';
import './index.less';
import NavContentContainer from '../../components/NavContentContainer';
import {
  querySpots,
  queryProjects,
  queryLabelPoints,
  querySpotByPRIDForMap,
  queryProjectById,
  querySpotMapById,
} from '../../services/localApi';
import '../../utils/leaflet-tilelayer-cordova';
import isCordova from '../../utils/cordova';
import config from '../../config';
import {
  floor,
  ceil,
  gcj02toWgs84LatLng,
  wgs84toBd09LatLng,
  getCurrentPosition,
} from '../../utils/util';
import { processTileBackground } from '../../services/tileDownloadManager';
//import { getPicture, getPictureExif } from '../../utils/fileUtil';
//其他单位已关联图斑数据源
//let spot_otherDatas = null;
// 要关联项目的图斑
let spot;

/* eslint-disable */
// 是否禁用所有的弹出气泡
let DISABLE_ALL_POPUP = false;

// 通过覆盖bindPopup方法（重写click）禁用所有的弹出气泡
L.Layer.include({
  bindPopup: function(content, options) {
    if (content instanceof L.Popup) {
      setOptions(content, options);
      this._popup = content;
      content._source = this;
    } else {
      if (!this._popup || options) {
        this._popup = new L.Popup(options, this);
      }
      this._popup.setContent(content);
    }

    if (!this._popupHandlersAdded) {
      this.on({
        click: e => {
          if (!DISABLE_ALL_POPUP) this._openPopup(e);
        },
        keypress: this._onKeyPress,
        remove: this.closePopup,
        move: this._movePopup,
      });
      this._popupHandlersAdded = true;
    }

    return this;
  },
});
/* eslint-enable */

// 未复核图斑边框颜色、已复核图斑边框颜色、其他单位图斑边框颜色、本单位项目边框颜色、其他单位项目边框颜色、图斑填充颜色、项目填充颜色、边框宽度、虚线数组
const UNFINISHED_SPOT_COLOR = '#e6d933';
const FINISHED_SPOT_COLOR = '#ff6100';
const OHTER_SPOT_COLOR = '#006fff';
const SELF_PROJECT_COLOR = '#e60000';
const OHTER_PROJECT_COLOR = '#e6c3c3';
const SPOT_FILL_COLOR = 'rgba(255,255,0,0.4)';
const PROJECT_FILL_COLOR = 'rgba(230,0,0,0.4)';
const BORDER_WIDTH = 3;
const DASH_ARRAY = '5';

//矢量瓦片高亮样式符号style
const highlightstyle = {
  fillColor: '#e6d933',
  fillOpacity: 0.1,
  stroke: true,
  fill: true,
  color: '#00bfff',
  opacity: 1,
  weight: BORDER_WIDTH,
};
//项目关联图斑高亮样式符号style
const relationHLightstyle = {
  fillColor: '#FFFF00',
  fillOpacity: 0.6,
  stroke: true,
  fill: true,
  color: '#00FF00',
  opacity: 1,
  weight: BORDER_WIDTH,
};
//聚合标注点符号style
const ClusterBorderColor = 'rgba(110, 204, 57, 1)';
const ClusterBackGroundColor = 'rgba(110, 204, 57, 0.3)';
// 参考：
// https://reacttraining.com/react-router/web/api/withRouter
// https://stackoverflow.com/questions/41911309/how-to-listen-to-route-changes-in-react-router-v4
@withRouter
@connect(({ index, login }) => ({
  index,
  login,
}))
export default class Map extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
    };
    this.map = null;
    this.isShowHighLight = true;
  }

  componentDidMount() {
    console.log('地图初始化加载');
    const me = this;
    // 创建图层
    me.createLayers();

    // 创建地图
    me.createMap();

    // 添加所有要素
    me.addAllFeatures();

    // 创建图层管理控件
    me.createToc();

    // 创建比例尺控件
    me.createScale();

    // 创建定位当前位置按钮
    me.createLocateButton();

    // 创建书签按钮
    me.createBookmarkButton();

    // 创建标注按钮
    me.createLabelPointButton();

    // 创建离线地图下载按钮
    me.createOfflineMapButton();
  }

  // eslint-disable-next-line
  componentDidUpdate(prevProps) {
    this.map.invalidateSize();
    // if (this.props.location !== prevProps.location) {
    // }
  }

  componentWillReceiveProps(nextProps) {
    // 刷新地图上的所有要素
    if (nextProps.refreshAllFeatures !== this.props.refreshAllFeatures) {
      console.log('refreshAllFeatures', nextProps.refreshAllFeatures);
      this.refreshAllFeatures();
    }

    // 刷新地图上的图斑
    if (nextProps.refreshSpots !== this.props.refreshSpots) {
      console.log('refreshSpots', nextProps.refreshSpots);
      this.refreshSpots();
    }

    // 刷新地图上的项目
    if (nextProps.refreshProjects !== this.props.refreshProjects) {
      console.log('refreshProjects', nextProps.refreshProjects);
      //this.refreshProjects();
      this.clearHighlight();
      this.selfProjectVGLayer.closePopup();
    }

    // 刷新地图上的标注点
    if (nextProps.refreshLabelPoints !== this.props.refreshLabelPoints) {
      console.log('refreshLabelPoints', nextProps.refreshLabelPoints);
      this.refreshLabelPoints();
    }

    // 添加标注点
    if (nextProps.addLabelPointToMap !== this.props.addLabelPointToMap) {
      console.log('addLabelPointToMap', nextProps.addLabelPointToMap);
      this.addLabelPoint(nextProps.addLabelPointToMap);
    }

    // 刷新多个图斑
    if (nextProps.refreshMultipleSpots !== this.props.refreshMultipleSpots) {
      console.log('refreshMultipleSpots', nextProps.refreshMultipleSpots);
      this.refreshMultipleSpots(nextProps.refreshMultipleSpots);
    }

    // 定位
    const { id, type } = nextProps.location.state || {};
    if (id) {
      this.locateFeature(id, type);
    }
  }

  // 返回
  onLeftClick = () => {
    this.props.dispatch({
      type: 'index/goBack',
    });
  };

  // 创建图层
  // eslint-disable-next-line
  createLayers = () => {
    const { offlineBasemap, onlineBasemaps } = config;

    // 离线底图
    if (isCordova()) {
      // 自己发布的影像瓦片图层（离线）
      const myOfflineImageLayer = L.tileLayerCordova(
        `${offlineBasemap.url}/tile/{z}/{y}/{x}`,
        // `${offlineBasemap.url}`,
        {
          minZoom: offlineBasemap.minZoom,
          maxZoom: offlineBasemap.maxZoom,
          folder: offlineBasemap.folder,
          name: offlineBasemap.name,
          debug: offlineBasemap.debug,
          //subdomains: offlineBasemap.subdomains
        },
        () => myOfflineImageLayer.goOffline()
      );
      this.myOfflineImageLayer = myOfflineImageLayer;
    } else {
      // 自己发布的影像瓦片图层（使用在线地图模拟离线地图）
      const myOfflineImageLayer = L.tileLayer(`${offlineBasemap.url}/tile/{z}/{y}/{x}`, {
        // const myOfflineImageLayer = L.tileLayer(`${offlineBasemap.url}`, {
        minZoom: offlineBasemap.minZoom,
        maxZoom: offlineBasemap.maxZoom,
        // subdomains: offlineBasemap.subdomains
      });
      this.myOfflineImageLayer = myOfflineImageLayer;
    }

    // 在线底图
    this.onlineBasemapLayers = onlineBasemaps.map(item => {
      // return L.tileLayer(`${item.url}/tile/{z}/{y}/{x}`, {
      //   minZoom: item.minZoom,
      //   maxZoom: item.maxZoom,
      // });
      return L.tileLayer(`${item.url}`, {
        minZoom: item.minZoom,
        maxZoom: item.maxZoom,
        subdomains: item.subdomains,
      });
    });

    // 定位图层
    const locateLayer = L.layerGroup([]);
    this.locateLayer = locateLayer;

    // 标注点
    this.labelPointLayer = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      chunkedLoading: true,
      maxClusterRadius: 100, //默认80
      iconCreateFunction: function(cluster) {
        return L.BeautifyIcon.icon({
          ...{
            iconShape: 'circle',
            iconSize: [40, 40],
            borderWidth: BORDER_WIDTH,
            innerIconAnchor: [0, 8],
            isAlphaNumericIcon: true,
            text: cluster.getChildCount(),
            textColor: '#000',
          },
          ...{
            borderColor: ClusterBorderColor,
            backgroundColor: ClusterBackGroundColor,
          },
        });
      },
    });

    this.createVectorSpotLayers();
    //矢量瓦片未关联_未复核图斑图层
    this.unBoundSpotHighLightUnFinished = null;
    //未关联_未复核图斑聚合图层
    this.unBoundSpotmarkerClusterUnFinished = L.markerClusterGroup({
      clusterPane: 'markerClusterZIndex',
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      chunkedLoading: true,
      maxClusterRadius: 200, //默认80
      iconCreateFunction: function(cluster) {
        return L.BeautifyIcon.icon({
          ...{
            iconShape: 'circle',
            iconSize: [40, 40],
            borderWidth: BORDER_WIDTH,
            innerIconAnchor: [0, 8],
            isAlphaNumericIcon: true,
            text: cluster.getChildCount(),
            textColor: '#000',
          },
          ...{
            borderStyle: 'dashed',
            borderColor: UNFINISHED_SPOT_COLOR,
            backgroundColor: SPOT_FILL_COLOR,
          },
        });
      },
    });
    //未关联_未复核图斑图层组
    this.unBoundSpotLayerGroupUnFinished = L.layerGroup([
      this.unBoundSpotVGLayerUnFinished,
      this.unBoundSpotmarkerClusterUnFinished,
    ]);

    //矢量瓦片未关联_已复核图斑图层
    this.unBoundSpotHighLightFinished = null;
    //未关联_已复核图斑聚合图层
    this.unBoundSpotmarkerClusterFinished = L.markerClusterGroup({
      clusterPane: 'markerClusterZIndex',
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      chunkedLoading: true,
      maxClusterRadius: 200, //默认80
      iconCreateFunction: function(cluster) {
        return L.BeautifyIcon.icon({
          ...{
            iconShape: 'circle',
            iconSize: [40, 40],
            borderWidth: BORDER_WIDTH,
            innerIconAnchor: [0, 8],
            isAlphaNumericIcon: true,
            text: cluster.getChildCount(),
            textColor: '#000',
          },
          ...{
            borderStyle: 'dashed',
            borderColor: FINISHED_SPOT_COLOR,
            backgroundColor: SPOT_FILL_COLOR,
          },
        });
      },
    });
    //未关联_已复核图斑图层组
    this.unBoundSpotLayerGroupFinished = L.layerGroup([
      this.unBoundSpotVGLayerFinished,
      this.unBoundSpotmarkerClusterFinished,
    ]);

    //矢量瓦片本单位已关联_未复核图斑图层
    this.selfBoundSpotHighLightUnFinished = null;
    //本单位已关联_未复核图斑聚合图层
    this.selfBoundSpotmarkerClusterUnFinished = L.markerClusterGroup({
      clusterPane: 'markerClusterZIndex',
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      chunkedLoading: true,
      maxClusterRadius: 200, //默认80
      iconCreateFunction: function(cluster) {
        return L.BeautifyIcon.icon({
          ...{
            iconShape: 'circle',
            iconSize: [40, 40],
            borderWidth: BORDER_WIDTH,
            innerIconAnchor: [0, 8],
            isAlphaNumericIcon: true,
            text: cluster.getChildCount(),
            textColor: '#000',
          },
          ...{
            borderColor: UNFINISHED_SPOT_COLOR,
            backgroundColor: SPOT_FILL_COLOR,
          },
        });
      },
    });
    //本单位已关联_未复核图斑图层组
    this.selfBoundSpotLayerGroupUnFinished = L.layerGroup([
      this.selfBoundSpotVGLayerUnFinished,
      this.selfBoundSpotmarkerClusterUnFinished,
    ]);

    //矢量瓦片本单位已关联_已复核图斑图层
    this.selfBoundSpotHighLightFinished = null;
    //本单位已关联_已复核图斑聚合图层
    this.selfBoundSpotmarkerClusterFinished = L.markerClusterGroup({
      clusterPane: 'markerClusterZIndex',
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      chunkedLoading: true,
      maxClusterRadius: 200, //默认80
      iconCreateFunction: function(cluster) {
        return L.BeautifyIcon.icon({
          ...{
            iconShape: 'circle',
            iconSize: [40, 40],
            borderWidth: BORDER_WIDTH,
            innerIconAnchor: [0, 8],
            isAlphaNumericIcon: true,
            text: cluster.getChildCount(),
            textColor: '#000',
          },
          ...{
            borderColor: FINISHED_SPOT_COLOR,
            backgroundColor: SPOT_FILL_COLOR,
          },
        });
      },
    });
    //本单位已关联_已复核图斑图层组
    this.selfBoundSpotLayerGroupFinished = L.layerGroup([
      this.selfBoundSpotVGLayerFinished,
      this.selfBoundSpotmarkerClusterFinished,
    ]);

    //矢量瓦片其他单位已关联图斑图层
    this.otherBoundSpotHighLight = null;
    //其他单位已关联图斑聚合图层
    this.otherBoundSpotmarkerCluster = L.markerClusterGroup({
      clusterPane: 'markerClusterZIndex',
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      chunkedLoading: true,
      maxClusterRadius: 200, //默认80
      iconCreateFunction: function(cluster) {
        return L.BeautifyIcon.icon({
          ...{
            iconShape: 'circle',
            iconSize: [40, 40],
            borderWidth: BORDER_WIDTH,
            innerIconAnchor: [0, 8],
            isAlphaNumericIcon: true,
            text: cluster.getChildCount(),
            textColor: '#000',
          },
          ...{
            borderColor: OHTER_SPOT_COLOR,
            backgroundColor: SPOT_FILL_COLOR,
          },
        });
      },
    });
    //其他单位已关联图斑图层组
    this.otherBoundSpotLayerGroup = L.layerGroup([
      this.otherBoundSpotVGLayer,
      this.otherBoundSpotmarkerCluster,
    ]);

    this.createVectorProjectLayers();
    //矢量瓦片本单位项目红线图层
    this.selfProjectHighLight = null;
    //本单位项目红线聚合图层
    this.selfProjectmarkerCluster = L.markerClusterGroup({
      clusterPane: 'markerClusterZIndex',
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      chunkedLoading: true,
      maxClusterRadius: 200, //默认80
      iconCreateFunction: function(cluster) {
        return L.BeautifyIcon.icon({
          ...{
            iconShape: 'circle',
            iconSize: [40, 40],
            borderWidth: BORDER_WIDTH,
            innerIconAnchor: [0, 8],
            isAlphaNumericIcon: true,
            text: cluster.getChildCount(),
            textColor: '#000',
          },
          ...{
            borderColor: SELF_PROJECT_COLOR,
            backgroundColor: PROJECT_FILL_COLOR,
          },
        });
      },
    });
    //本单位项目红线图层组
    this.selfProjectLayerGroup = L.layerGroup([
      this.selfProjectVGLayer,
      this.selfProjectmarkerCluster,
    ]);

    //矢量瓦片其他单位项目红线图层
    this.otherProjectHighLight = null;
    //其他单位项目红线聚合图层
    this.otherProjectmarkerCluster = L.markerClusterGroup({
      clusterPane: 'markerClusterZIndex',
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      chunkedLoading: true,
      maxClusterRadius: 200, //默认80
      iconCreateFunction: function(cluster) {
        return L.BeautifyIcon.icon({
          ...{
            iconShape: 'circle',
            iconSize: [40, 40],
            borderWidth: BORDER_WIDTH,
            innerIconAnchor: [0, 8],
            isAlphaNumericIcon: true,
            text: cluster.getChildCount(),
            textColor: '#000',
          },
          ...{
            borderColor: OHTER_PROJECT_COLOR,
            backgroundColor: PROJECT_FILL_COLOR,
          },
        });
      },
    });
    //其他单位项目红线图层组
    this.otherProjectLayerGroup = L.layerGroup([
      this.otherProjectVGLayer,
      this.otherProjectmarkerCluster,
    ]);
  };

  // 创建矢量瓦片扰动图斑图层
  createVectorSpotLayers = () => {
    //矢量瓦片未关联_未复核图斑图层
    const unBoundSpotVGLayerUnFinished = L.gridLayer();
    Object.assign(unBoundSpotVGLayerUnFinished, {
      style: {
        color: UNFINISHED_SPOT_COLOR,
        dashArray: DASH_ARRAY,
        weight: BORDER_WIDTH,
        fillColor: SPOT_FILL_COLOR,
        fill: true,
      },
      isEdit: true,
      HighLightType: 1,
    });
    this.unBoundSpotVGLayerUnFinished = unBoundSpotVGLayerUnFinished;

    //矢量瓦片未关联_已复核图斑图层
    const unBoundSpotVGLayerFinished = L.gridLayer();
    Object.assign(unBoundSpotVGLayerFinished, {
      style: {
        color: FINISHED_SPOT_COLOR,
        dashArray: DASH_ARRAY,
        weight: BORDER_WIDTH,
        fillColor: SPOT_FILL_COLOR,
        fill: true,
      },
      isEdit: true,
      HighLightType: 2,
    });
    this.unBoundSpotVGLayerFinished = unBoundSpotVGLayerFinished;

    //矢量瓦片本单位已关联_未复核图斑图层
    const selfBoundSpotVGLayerUnFinished = L.gridLayer();
    Object.assign(selfBoundSpotVGLayerUnFinished, {
      style: {
        color: UNFINISHED_SPOT_COLOR,
        weight: BORDER_WIDTH,
        fillColor: SPOT_FILL_COLOR,
        fill: true,
      },
      isEdit: true,
      HighLightType: 3,
    });
    this.selfBoundSpotVGLayerUnFinished = selfBoundSpotVGLayerUnFinished;

    //矢量瓦片本单位已关联_已复核图斑图层
    const selfBoundSpotVGLayerFinished = L.gridLayer();
    Object.assign(selfBoundSpotVGLayerFinished, {
      style: {
        color: FINISHED_SPOT_COLOR,
        weight: BORDER_WIDTH,
        fillColor: SPOT_FILL_COLOR,
        fill: true,
      },
      isEdit: true,
      HighLightType: 4,
    });
    this.selfBoundSpotVGLayerFinished = selfBoundSpotVGLayerFinished;

    //矢量瓦片其他单位已关联图斑图层
    const otherBoundSpotVGLayer = L.gridLayer();
    Object.assign(otherBoundSpotVGLayer, {
      style: {
        color: OHTER_SPOT_COLOR,
        weight: BORDER_WIDTH,
        fillColor: SPOT_FILL_COLOR,
        fill: true,
      },
      isEdit: true,
      HighLightType: 5,
    });
    this.otherBoundSpotVGLayer = otherBoundSpotVGLayer;
  };

  // 创建矢量瓦片项目红线图层
  createVectorProjectLayers = () => {
    //矢量瓦片本单位项目红线图层
    const selfProjectVGLayer = L.gridLayer();
    Object.assign(selfProjectVGLayer, {
      style: {
        color: SELF_PROJECT_COLOR,
        weight: BORDER_WIDTH,
        fillColor: PROJECT_FILL_COLOR,
        fill: true,
      },
      isEdit: true,
      HighLightType: 6,
    });
    this.selfProjectVGLayer = selfProjectVGLayer;

    //矢量瓦片其他单位项目红线图层
    const otherProjectVGLayer = L.gridLayer();
    Object.assign(otherProjectVGLayer, {
      style: {
        color: OHTER_PROJECT_COLOR,
        weight: BORDER_WIDTH,
        fillColor: PROJECT_FILL_COLOR,
        fill: true,
      },
      isEdit: true,
      HighLightType: 7,
    });
    this.otherProjectVGLayer = otherProjectVGLayer;
  };

  // 创建Deflate图层
  createDeflateLayer = markerOption => {
    const layer = L.deflate({
      level: config.pointClusterLevel,
      markerOptions: {
        icon: L.BeautifyIcon.icon({
          ...{
            iconShape: 'marker',
            borderWidth: BORDER_WIDTH,
          },
          ...markerOption,
        }),
      },
      markerCluster: true,
      markerClusterOptions: {
        iconCreateFunction(cluster) {
          return L.BeautifyIcon.icon({
            ...{
              iconShape: 'circle',
              iconSize: [40, 40],
              borderWidth: BORDER_WIDTH,
              innerIconAnchor: [0, 8],
              isAlphaNumericIcon: true,
              text: cluster.getChildCount(),
              textColor: '#000',
            },
            ...markerOption,
          });
        },
      },
    });

    layer.features = [];
    return layer;
  };

  // 创建地图
  createMap = () => {
    const {
      myOfflineImageLayer,
      onlineBasemapLayers,
      //labelPointLayer,
      locateLayer,
      //图层组
      unBoundSpotLayerGroupUnFinished,
      unBoundSpotLayerGroupFinished,
      selfBoundSpotLayerGroupUnFinished,
      selfBoundSpotLayerGroupFinished,
      //otherBoundSpotLayerGroup,
      selfProjectLayerGroup,
      //otherProjectLayerGroup
    } = this;
    const {
      mapDefault: { center, zoom },
    } = config;

    const map = L.map('map', {
      center,
      zoom,
      crs: L.CRS.EPSG3857,
      attributionControl: false,
      layers: [
        // myOfflineImageLayer,
        onlineBasemapLayers.length > 0 ? onlineBasemapLayers[0] : myOfflineImageLayer,
        //labelPointLayer,
        locateLayer,
        //图层组
        unBoundSpotLayerGroupUnFinished,
        unBoundSpotLayerGroupFinished,
        selfBoundSpotLayerGroupUnFinished,
        selfBoundSpotLayerGroupFinished,
        //otherBoundSpotLayerGroup,
        selfProjectLayerGroup,
        //otherProjectLayerGroup
      ],
    });
    this.map = map;
  };

  // 创建图层管理控件
  createToc = () => {
    const {
      map,
      myOfflineImageLayer,
      onlineBasemapLayers,
      labelPointLayer,
      //图层组
      unBoundSpotLayerGroupUnFinished,
      unBoundSpotLayerGroupFinished,
      selfBoundSpotLayerGroupUnFinished,
      selfBoundSpotLayerGroupFinished,
      //otherBoundSpotLayerGroup,
      selfProjectLayerGroup,
      //otherProjectLayerGroup
    } = this;
    const { offlineBasemap, onlineBasemaps } = config;

    // 构建图层标题及图例
    const getTitle = (text, borderColor, fillColor, isBorderDashed) => {
      return `<i style='display:inline-block;border:${
        isBorderDashed ? 'dashed' : 'solid'
      } 2px ${borderColor};background:${fillColor};width:20px;height:20px;position:relative;top:4px;'></i><span style='padding-left:1px;'>${text}</span>`;
    };

    // 构建图片形式的标题及图例
    const getImageTitle = (text, imgUrl) => {
      return `<div style='display:inline-block;width:20px;height:20px;position:relative;top:4px;'><img src='${imgUrl}' style='height:20px;'/></div><span style='padding-left:1px;'>${text}</span>`;
    };
    // 底图图层
    const baseMaps = {};
    // baseMaps[offlineBasemap.title] = myOfflineImageLayer;
    // onlineBasemaps.forEach((item, i) => {
    //   baseMaps[item.title] = onlineBasemapLayers[i];
    // });
    baseMaps[getImageTitle(offlineBasemap.title, offlineBasemap.picUrl)] = myOfflineImageLayer;
    onlineBasemaps.forEach((item, i) => {
      baseMaps[getImageTitle(item.title, item.picUrl)] = onlineBasemapLayers[i];
    });

    // 专题图层
    const overlayMaps = {
      [getTitle(
        '扰动图斑_未关联_未复核',
        UNFINISHED_SPOT_COLOR,
        SPOT_FILL_COLOR,
        true
      )]: unBoundSpotLayerGroupUnFinished,
      [getTitle(
        '扰动图斑_未关联_已复核',
        FINISHED_SPOT_COLOR,
        SPOT_FILL_COLOR,
        true
      )]: unBoundSpotLayerGroupFinished,
      [getTitle(
        '扰动图斑_已关联_未复核',
        UNFINISHED_SPOT_COLOR,
        SPOT_FILL_COLOR
      )]: selfBoundSpotLayerGroupUnFinished,
      [getTitle(
        '扰动图斑_已关联_已复核',
        FINISHED_SPOT_COLOR,
        SPOT_FILL_COLOR
      )]: selfBoundSpotLayerGroupFinished,
      // [getTitle('扰动图斑_其他单位已关联', OHTER_SPOT_COLOR, SPOT_FILL_COLOR)]: otherBoundSpotLayerGroup,
      [getTitle('项目红线', SELF_PROJECT_COLOR, PROJECT_FILL_COLOR)]: selfProjectLayerGroup,
      // [getTitle('项目红线_本单位', SELF_PROJECT_COLOR, PROJECT_FILL_COLOR)]: selfProjectLayerGroup,
      // [getTitle('项目红线_其他单位', OHTER_PROJECT_COLOR, PROJECT_FILL_COLOR)]: otherProjectLayerGroup,
      [getImageTitle('标注点', labelPointMarkerImageUrl)]: labelPointLayer,
    };

    // 添加控件
    const container = L.control
      .layers(baseMaps, overlayMaps)
      .addTo(map)
      .getContainer();

    // 修改图标样式
    L.DomUtil.addClass(container.firstChild, 'iconfont icon-layer global-icon-normal');
  };

  // 创建比例尺控件
  createScale = () => {
    const { map } = this;

    L.control
      .scale({
        imperial: false,
      })
      .addTo(map);
  };

  // 创建定位当前位置按钮
  createLocateButton = () => {
    const { map, locateLayer, iconTextButtonHtml } = this;

    L.easyButton(iconTextButtonHtml('icon-locate'), () => {
      console.log('定位');
      // eslint-disable-next-line
      getCurrentPosition().then(result => {
        // const { latitude, longitude } = result;
        const { radius, latitude, longitude } = result;

        // 绘制当前位置
        const latlng = gcj02toWgs84LatLng(L.latLng(latitude, longitude));
        locateLayer.clearLayers();

        // 画圆
        // L.circle(latlng, 150).addTo(locateLayer);
        L.circle(latlng, radius).addTo(locateLayer);

        // 画点
        L.circle(latlng, {
          color: '#FF0000',
          fillColor: '#FF0000',
          radius: 0.5,
          fillOpacity: 1,
        }).addTo(locateLayer);

        // 平移至当前位置
        map.setView(latlng, 17);
      });
    }).addTo(map);
  };

  // 获取图标文本按钮html
  iconTextButtonHtml = (icon, text) => {
    if (text) {
      return `<div class="global-map-button-icon"><i class="iconfont ${icon}"></i></div><div class="global-map-button-text">${text}</div>`;
    } else {
      return `iconfont ${icon} global-icon-normal`;
    }
  };

  // 创建标注按钮
  createLabelPointButton = () => {
    const {
      map,
      iconTextButtonHtml,
      props: { dispatch },
    } = this;

    const onClick = e => {
      console.log(e);
      // 关闭单击事件
      map.off('click', onClick);
      DISABLE_ALL_POPUP = false;

      const { latlng } = e;
      const SHAPE = JSON.stringify({ x: latlng.lng, y: latlng.lat });

      // 调用编辑页
      dispatch({
        type: 'labelPoint/showEditPage',
        payload: {
          SHAPE,
        },
      });
    };

    L.easyButton(
      iconTextButtonHtml('icon-geomark', '标注'),
      () => {
        // 监听单击事件
        map.off('click', onClick);
        map.on('click', onClick);
        DISABLE_ALL_POPUP = true;
        Toast.info('请在地图上单击标注！', 0.5);
      },
      {
        position: 'bottomleft',
      }
    ).addTo(map);
  };

  // 创建书签按钮
  createBookmarkButton = () => {
    const { map } = this;
    const container = new L.Control.Bookmarks({
      position: 'bottomleft',
      title: '书签',
      emptyMessage: '无书签',
      addBookmarkMessage: '添加书签',
      formPopup: {
        templateOptions: {
          formClass: 'leaflet-bookmarks-form',
          inputClass: 'leaflet-bookmarks-form-input',
          inputErrorClass: 'has-error',
          idInputClass: 'leaflet-bookmarks-form-id',
          coordsClass: 'leaflet-bookmarks-form-coords',
          submitClass: 'leaflet-bookmarks-form-submit',
          inputPlaceholder: '请输入书签名',
          removeClass: 'leaflet-bookmarks-form-remove',
          editClass: 'leaflet-bookmarks-form-edit',
          cancelClass: 'leaflet-bookmarks-form-cancel',
          editableClass: 'editable',
          removableClass: 'removable',
          menuItemClass: 'nav-item',
          editMenuText: '编辑',
          removeMenuText: '移除',
          cancelMenuText: '取消',
          submitTextCreate: '+',
          submitTextEdit: '<span class="icon-checkmark"></span>',
        },
      },
    })
      .addTo(map)
      .getContainer();

    // 修改图标样式
    L.DomUtil.addClass(container.firstChild.firstChild, 'custom-bookmarks-icon-wrapper');
  };

  // 创建离线地图下载按钮
  createOfflineMapButton = () => {
    const { map, iconTextButtonHtml } = this;

    L.easyButton(
      iconTextButtonHtml('icon-map-offline'),
      () => {
        // 获取闭包，保留两位小数
        const bounds = this.map.getBounds().pad(0.05); // 扩大5%的边界
        // console.log(bounds.toBBoxString());
        const bbox = `${floor(bounds.getWest(), 2)},${floor(bounds.getSouth(), 2)},${ceil(
          bounds.getEast(),
          2
        )},${ceil(bounds.getNorth(), 2)}`;

        Modal.alert('影像下载', '确定要将当前屏幕范围内的影像下载到本地吗？', [
          {
            text: '取消',
            onPress: () => {},
          },
          {
            text: '确定',
            onPress: () => {
              this.props.dispatch({
                type: 'offlineMap/addTileDownloadInfo',
                payload: { bbox },
                callback: exist => {
                  if (exist) {
                    Toast.info('当前范围已存在！', 1);
                  } else {
                    processTileBackground();
                    this.props.dispatch({
                      type: 'my/showOfflineMap',
                    });
                  }
                },
              });
            },
          },
        ]);
      },
      {
        position: 'topright',
      }
    ).addTo(map);
  };

  // -----------------------------------------------------------------------------------------------------
  // 定位要素
  // eslint-disable-next-line
  async locateFeature(id, type) {
    type === 'spot'
      ? this.locateSpotFeature(id)
      : type === 'project'
      ? this.locatePtojectFeature(id)
      : null;
  }

  async locateSpotFeature(id) {
    //根据id查询数据库对应的记录records
    const records = await querySpotMapById({ id: id });
    if (records.length > 0) {
      //根据查询记录判断属于哪个图斑类型图层
      const layer = this.getSpotLayerByRecord(records[0]);
      const isEdit = layer.isEdit || layer.options.isEdit;
      const geojson = JSON.parse(records[0].SHAPE);
      const centroid = turf.centroid(geojson);
      const latlng = L.latLng(centroid.geometry.coordinates[1], centroid.geometry.coordinates[0]);
      this.map.setView(latlng, config.locateFeatureLevel);
      setTimeout(() => {
        const elements = this.getSpotPopupContent(records[0], latlng, isEdit);
        this.map.openPopup(elements[0], latlng);
      }, 0);
      return true;
    }
    return false;
  }

  // 根据id查询的记录值获取对应的图斑类型图层
  getSpotLayerByRecord(record) {
    const {
      login: { user },
    } = this.props;
    // 单位id
    const { dwid } = user;

    let layer = null;
    if (record.PRID === null && (record.ISREVIEW !== 1 || record.ISREVIEW === null)) {
      layer = this.unBoundSpotVGLayerUnFinished;
    } else if (record.PRID === null && record.ISREVIEW === 1) {
      layer = this.unBoundSpotVGLayerFinished;
    } else if (record.PRID !== null && (record.ISREVIEW !== 1 || record.ISREVIEW === null)) {
      layer = this.selfBoundSpotVGLayerUnFinished;
    } else if (record.PRID !== null && record.ISREVIEW === 1) {
      layer = this.selfBoundSpotVGLayerFinished;
    }
    // else if(record.PRID !== null && (record.SUP_UNIT === dwid || (record.SUP_UNIT === null && record.BDID === dwid)) && (record.ISREVIEW !==1 || record.ISREVIEW === null)){
    //   layer = this.selfBoundSpotVGLayerUnFinished;
    // }
    // else if(record.PRID !== null && (record.SUP_UNIT === dwid || (record.SUP_UNIT === null && record.BDID === dwid)) && (record.ISREVIEW ===1)){
    //   layer = this.selfBoundSpotVGLayerFinished;
    // }
    // else if(record.PRID !== null && ((record.SUP_UNIT !== null && record.SUP_UNIT !== dwid) || (record.SUP_UNIT === null && record.BDID !== dwid))){
    //   layer = this.otherBoundSpotVGLayer;
    // }
    return layer;
  }

  // 根据id查询的记录值获取对应的项目红线类型图层
  getProjectLayerByRecord(record) {
    // const {
    //   login: { user },
    // } = this.props;
    // // 单位id
    // const { dwid } = user;

    let layer = null;
    layer = this.selfProjectVGLayer;
    // if(record.SUP_UNIT === dwid || record.SUP_UNIT === null){
    //    layer = this.selfProjectVGLayer;
    // }
    // else if(record.SUP_UNIT !== dwid){
    //   layer = this.otherProjectVGLayer;
    // }
    return layer;
  }

  async locatePtojectFeature(id) {
    //根据id查询数据库对应的记录records
    const records = await queryProjectById({ id: id });
    if (records.length > 0) {
      //根据查询记录判断属于哪个红线红线类型图层
      const layer = this.getProjectLayerByRecord(records[0]);
      const isEdit = layer.isEdit || layer.options.isEdit;
      const geojson = JSON.parse(records[0].SHAPE);
      let coordinate = null;
      if (geojson.type === 'Polygon') {
        coordinate = geojson.coordinates[0];
        coordinate = coordinate[0];
      } else if (geojson.type === 'MultiPolygon') {
        coordinate = geojson.coordinates[0];
        coordinate = coordinate[0][0];
      }
      const latlng = L.latLng(coordinate[1], coordinate[0]);
      this.map.setView(latlng, config.locateFeatureLevel);
      setTimeout(() => {
        const elements = this.getProjectPopupContent(records[0], latlng, isEdit);
        this.map.openPopup(elements[0], latlng);
      }, 0);
      return true;
    }
    return false;
  }

  // 移除标注要素
  // eslint-disable-next-line
  removeLabelFeature = layer => {
    if (layer) {
      this.labelPointLayer.removeLayer(layer);
    }
  };

  // -----------------------------------------------------------------------------------------------------
  // 清除图斑
  async clearSpots() {
    const {
      unBoundSpotmarkerClusterUnFinished,
      unBoundSpotmarkerClusterFinished,
      selfBoundSpotmarkerClusterUnFinished,
      selfBoundSpotmarkerClusterFinished,
      //otherBoundSpotmarkerCluster,
      clearClusterLayers,
    } = this;
    //清空聚合图斑数据
    clearClusterLayers(unBoundSpotmarkerClusterUnFinished);
    clearClusterLayers(unBoundSpotmarkerClusterFinished);
    clearClusterLayers(selfBoundSpotmarkerClusterUnFinished);
    clearClusterLayers(selfBoundSpotmarkerClusterFinished);
    //clearClusterLayers(otherBoundSpotmarkerCluster);
    //重新创建矢量瓦片扰动图斑图层
    this.unBoundSpotVGLayerUnFinished.remove();
    this.unBoundSpotVGLayerFinished.remove();
    this.selfBoundSpotVGLayerUnFinished.remove();
    this.selfBoundSpotVGLayerFinished.remove();
    //this.otherBoundSpotVGLayer.remove();
    this.createVectorSpotLayers();
  }

  // 清除项目
  async clearProjects() {
    // const { selfProjectmarkerCluster, otherProjectmarkerCluster, clearClusterLayers } = this;
    const { selfProjectmarkerCluster, clearClusterLayers } = this;
    //清空聚合项目红线数据
    clearClusterLayers(selfProjectmarkerCluster);
    //clearClusterLayers(otherProjectmarkerCluster);
    //重新创建矢量瓦片项目红线图层
    this.selfProjectVGLayer.remove();
    //this.otherProjectVGLayer.remove();
    this.createVectorProjectLayers();
  }

  // 清除标注点
  async clearLabelPoints() {
    const { labelPointLayer, clearClusterLayers } = this;
    clearClusterLayers(labelPointLayer);
  }

  // -----------------------------------------------------------------------------------------------------
  // 添加所有要素
  async addAllFeatures() {
    this.setState({ loading: true });

    const {
      mapDefault: { zoom },
    } = config;

    // 添加要素
    console.log('地图初始化绘制所有要素图形数据');
    //标注点
    await this.addLabelPoints();
    //矢量瓦片渲染加载方案
    this.map.createPane('markerClusterZIndex').style.zIndex = 800;
    await this.addVectorGridSpots();
    await this.addVectorGridProjects();
    // 加载数据后，地图定位到要素中任意一点
    if (this.initCenter) this.map.setView(this.initCenter, zoom);

    this.setState({ loading: false });

    //监听地图点击事件
    this.map.on('click', this.onClickMap);
    //监听地图范围变化事件
    this.map.on('moveend', this.onMoveendMap);
  }

  //刷新所有要素
  async refreshAllFeatures() {
    this.setState({ loading: true });

    const {
      mapDefault: { zoom },
    } = config;

    //初始化中心点置空
    this.initCenter = null;

    //清除要素
    await this.clearSpots();
    await this.clearProjects();
    await this.clearLabelPoints();

    //添加要素
    //标注点
    await this.addLabelPoints();
    //矢量瓦片渲染加载方案
    await this.addVectorGridSpots();
    await this.addVectorGridProjects();

    //加载数据后，地图定位到要素中任意一点
    if (this.initCenter) this.map.setView(this.initCenter, zoom);

    this.setState({ loading: false });
  }

  // 刷新图斑
  async refreshSpots() {
    this.setState({ loading: true });
    await this.clearSpots();
    //矢量瓦片渲染加载方案
    await this.addVectorGridSpots();
    this.setState({ loading: false });
  }

  // 刷新项目
  async refreshProjects() {
    this.setState({ loading: true });
    await this.clearProjects();
    //矢量瓦片渲染加载方案
    await this.addVectorGridProjects();
    this.setState({ loading: false });
  }

  // 刷新标注点
  async refreshLabelPoints() {
    this.setState({ loading: true });
    await this.clearLabelPoints();
    await this.addLabelPoints();
    this.setState({ loading: false });
  }

  // 刷新多个图斑
  async refreshMultipleSpots(records) {
    this.refreshSpots();
  }

  /*
   * 添加矢量瓦片图斑要素
   */
  async addVectorGridSpots() {
    const {
      unBoundSpotVGLayerUnFinished,
      unBoundSpotVGLayerFinished,
      selfBoundSpotVGLayerUnFinished,
      selfBoundSpotVGLayerFinished,
      //otherBoundSpotVGLayer,
      unBoundSpotmarkerClusterUnFinished,
      unBoundSpotmarkerClusterFinished,
      selfBoundSpotmarkerClusterUnFinished,
      selfBoundSpotmarkerClusterFinished,
      //otherBoundSpotmarkerCluster,
      unBoundSpotLayerGroupUnFinished,
      unBoundSpotLayerGroupFinished,
      selfBoundSpotLayerGroupUnFinished,
      selfBoundSpotLayerGroupFinished,
      //otherBoundSpotLayerGroup
    } = this;

    const {
      login: { user },
    } = this.props;
    // 单位id
    const { dwid } = user;

    // 未关联_未复核
    await this.onAddVectorGridSpots(
      '(PRID is null) and (isreview <> 1 or isreview is null)',
      unBoundSpotVGLayerUnFinished,
      300,
      unBoundSpotmarkerClusterUnFinished,
      unBoundSpotLayerGroupUnFinished
    );

    // 未关联_已复核
    await this.onAddVectorGridSpots(
      '(PRID is null) and (isreview = 1)',
      unBoundSpotVGLayerFinished,
      400,
      unBoundSpotmarkerClusterFinished,
      unBoundSpotLayerGroupFinished
    );

    // 已关联_未复核
    await this.onAddVectorGridSpots(
      `(PRID is not null) and (isreview <> 1 or isreview is null)`,
      selfBoundSpotVGLayerUnFinished,
      500,
      selfBoundSpotmarkerClusterUnFinished,
      selfBoundSpotLayerGroupUnFinished
    );

    // 已关联_已复核
    await this.onAddVectorGridSpots(
      `(PRID is not null) and (isreview = 1)`,
      selfBoundSpotVGLayerFinished,
      600,
      selfBoundSpotmarkerClusterFinished,
      selfBoundSpotLayerGroupFinished
    );

    // 本单位已关联_未复核
    //  await this.onAddVectorGridSpots(
    //   `(PRID is not null) and (project.SUP_UNIT='${dwid}' or (project.SUP_UNIT is null and BDID='${dwid}')) and (isreview <> 1 or isreview is null)`,
    //   selfBoundSpotVGLayerUnFinished,
    //   500,
    //   selfBoundSpotmarkerClusterUnFinished,
    //   selfBoundSpotLayerGroupUnFinished
    // );

    // 本单位已关联_已复核
    // await this.onAddVectorGridSpots(
    //   `(PRID is not null) and (project.SUP_UNIT='${dwid}' or (project.SUP_UNIT is null and BDID='${dwid}')) and (isreview = 1)`,
    //   selfBoundSpotVGLayerFinished,
    //   600,
    //   selfBoundSpotmarkerClusterFinished,
    //   selfBoundSpotLayerGroupFinished
    // );

    // 其他单位已关联
    // await this.onAddVectorGridSpots(
    //   `(PRID is not null) and ((project.SUP_UNIT is not null and project.SUP_UNIT <>'${dwid}') or (project.SUP_UNIT is null and BDID <>'${dwid}'))`,
    //   otherBoundSpotVGLayer,
    //   700,
    //   otherBoundSpotmarkerCluster,
    //   otherBoundSpotLayerGroup
    // );
  }

  /*
   * 添加矢量瓦片图斑图形（查询条件、图斑图层）
   */
  async onAddVectorGridSpots(where, layer, zIndex, clusterlayer, layergroup) {
    const items = await querySpots({
      where,
      limit: 1000000,
      returnGeometry: true,
    });
    //console.log('1323',items);
    //查询数据源构造geojson
    let geojson = this.data2GeoJSON(items, 'spot', layer);
    //console.log('1326',geojson);
    if (geojson) {
      //加载图斑聚合图层
      await this.addClusterLayers(geojson, clusterlayer);
      // console.log('矢量瓦片图斑数据', geojson);
      //加载图斑矢量瓦片图层
      await this.loadSpotVectorLayer(layer, geojson, zIndex, layergroup);
    }
  }

  /*
   * 加载扰动图斑以及项目红线聚合图层
   */
  async addClusterLayers(geojson, clusterlayer) {
    let markerList = [];
    for (let i = 0; i < geojson.features.length; i++) {
      let geometry = geojson.features[i].geometry;
      let coordinate = null;
      if (geometry.type === 'Polygon') {
        coordinate = geometry.coordinates[0];
        coordinate = coordinate[0];
      } else if (geometry.type === 'MultiPolygon') {
        coordinate = geometry.coordinates[0];
        coordinate = coordinate[0][0];
      }
      //const centroid = turf.centroid(geojson.features[i]);
      //let latLng = L.latLng(centroid.geometry.coordinates[1], centroid.geometry.coordinates[0]);
      let latLng = L.latLng(coordinate[1], coordinate[0]);
      let marker = L.marker(latLng, { pane: 'markerClusterZIndex', opacity: 0 });
      markerList.push(marker);
      // 要素中心点wgs84
      const center = latLng;
      if (this.initCenter == null) this.initCenter = center;
    }
    clusterlayer.addLayers(markerList);
  }

  /*
   * 清空扰动图斑以及项目红线聚合图层
   */
  async clearClusterLayers(clusterlayer) {
    clusterlayer.clearLayers();
  }
  /*
   * 监听地图范围变化事件
   */
  onMoveendMap = e => {
    const me = this;
    let zoom = me.map.getZoom();
    if (zoom > config.pointClusterLevel) {
      //隐藏聚合效果
      me.hideClusterLayers();
    } else {
      //显示聚合效果
      me.showClusterLayers();
    }
  };
  /*
   * 监听地图点击事件
   */
  onClickMap = e => {
    const me = this;
    // console.log('1596',me.isShowHighLight);
    if (!me.isShowHighLight) {
      me.clearHighlight();
      me.isShowHighLight = false;
    }
  };
  /*
   * 隐藏扰动图斑以及项目红线聚合图层
   */
  hideClusterLayers = () => {
    this.map.getPane('markerClusterZIndex').style.zIndex = 0;
  };
  /*
   * 显示扰动图斑以及项目红线聚合图层
   */
  showClusterLayers = () => {
    this.map.getPane('markerClusterZIndex').style.zIndex = 800;
  };
  /*
   * 矢量瓦片扰动图斑绘制函数
   */
  async loadSpotVectorLayer(layer, geojson, zIndex, layergroup) {
    const { HighLightType, isEdit } = layer;
    const me = this;
    let tepmLayer = layer;
    let data = geojson;
    let obj = {
      rendererFactory: L.svg.tile,
      //rendererFactory: L.canvas.tile,
      vectorTileLayerStyles: { sliced: me.getVectorStyles },
      interactive: true,
      getFeatureId: function(f) {
        return f.properties.QDNM;
      },
      maxZoom: config.mapDefault.maxZoom,
      minZoom: config.mapDefault.minZoom,
      zIndex: zIndex,
      HighLightType: HighLightType,
      isEdit: isEdit,
    };
    layer = L.vectorGrid.slicer(data, obj).on('click', function(e) {
      me.clearHighlight();
      switch (layer.options.HighLightType) {
        case 1:
          me.unBoundSpotHighLightUnFinished = e.layer.properties.QDNM;
          me.unBoundSpotVGLayerUnFinished = layer;
          break;
        case 2:
          me.unBoundSpotHighLightFinished = e.layer.properties.QDNM;
          me.unBoundSpotVGLayerFinished = layer;
          break;
        case 3:
          me.selfBoundSpotHighLightUnFinished = e.layer.properties.QDNM;
          me.selfBoundSpotVGLayerUnFinished = layer;
          break;
        case 4:
          me.selfBoundSpotHighLightFinished = e.layer.properties.QDNM;
          me.selfBoundSpotVGLayerFinished = layer;
          break;
        // case 5:
        //   me.otherBoundSpotHighLight = e.layer.properties.QDNM;
        //   me.otherBoundSpotVGLayer = layer;
        //     break;
      }
      layer.setFeatureStyle(e.layer.properties.QDNM, highlightstyle);
      //设置图层顺序
      layer.setZIndex(10);
      me.isShowHighLight = true;

      layer.unbindPopup();
      (async () => {
        let id = e.layer.properties.ID;
        const records = await querySpotMapById({ id: id });
        if (records.length > 0) {
          const elements = me.getSpotPopupContent(records[0], e.latlng, isEdit);
          layer.bindPopup(elements[0]).openPopup(e.latlng);
        }
      })();
    });
    layer.on('popupclose', e => {
      if (e) {
        me.isShowHighLight = false;
      }
    });
    layergroup.removeLayer(tepmLayer).addLayer(layer);
    switch (layer.options.HighLightType) {
      case 1:
        me.unBoundSpotVGLayerUnFinished = layer;
        break;
      case 2:
        me.unBoundSpotVGLayerFinished = layer;
        break;
      case 3:
        me.selfBoundSpotVGLayerUnFinished = layer;
        break;
      case 4:
        me.selfBoundSpotVGLayerFinished = layer;
        break;
      // case 5:
      //   me.otherBoundSpotVGLayer = layer;
      //     break;
    }
  }
  /*
   * 矢量瓦片扰动图斑获取点击内容函数
   */
  getSpotPopupContent(item, center, isEdit) {
    //console.log("item",item);
    const { toPopupItemStr } = this;
    // 获取百度坐标
    const latlng = wgs84toBd09LatLng(center);
    // 内容及单击事件
    const elements = jQuery(
      `<div>
    ${toPopupItemStr('图斑编号', item.QDNM)}
    ${toPopupItemStr('关联项目', item.PRNM)}
    ${toPopupItemStr('扰动合规性', item.BYD)}
    ${
      isEdit
        ? '<a class="edit">编辑</a>&nbsp;<a class="add">添加关联项目</a>&nbsp;'
        : '<a class="edit">查看</a>&nbsp;'
    }
    <a href="bdapp://map/direction?destination=${latlng.lat},${
        latlng.lng
      }&mode=driving">导航</a>&nbsp;
    </div>`
    );
    elements.data('ID', item.ID);
    elements.find('.edit').on('click', () => {
      // 调用编辑页面
      const id = elements.data('ID');
      this.props.dispatch({
        type: 'spot/showEditPage',
        payload: {
          selectedId: id,
        },
      });
    });

    // 添加关联项目
    elements.find('.add').on('click', () => {
      if (item.PRID) {
        Modal.alert('提示', `该图斑已关联项目,是否要更换项目?`, [
          { text: '取消', onPress: () => console.log('cancle') },
          { text: '确定', onPress: () => this.changeRelatedProject(item) },
        ]);
      } else {
        spot = item;
        Toast.info('请在地图上双击要关联的项目！', 1);
      }
    });

    return elements;
  }
  /*
   * 设置图斑的样式
   */
  getVectorStyles = (properties, zoom) => {
    var symbol = null;
    var style = properties['style'];
    symbol = style;
    return symbol;
  };
  /*
   * 清空矢量瓦片点击高亮
   */
  clearHighlight = () => {
    if (this.unBoundSpotHighLightUnFinished) {
      this.unBoundSpotVGLayerUnFinished.resetFeatureStyle(this.unBoundSpotHighLightUnFinished);
    }
    this.unBoundSpotHighLightUnFinished = null;

    if (this.unBoundSpotHighLightFinished) {
      this.unBoundSpotVGLayerFinished.resetFeatureStyle(this.unBoundSpotHighLightFinished);
    }
    this.unBoundSpotHighLightFinished = null;

    if (this.selfBoundSpotHighLightUnFinished) {
      this.selfBoundSpotVGLayerUnFinished.resetFeatureStyle(this.selfBoundSpotHighLightUnFinished);
    }
    this.selfBoundSpotHighLightUnFinished = null;

    if (this.selfBoundSpotHighLightFinished) {
      this.selfBoundSpotVGLayerFinished.resetFeatureStyle(this.selfBoundSpotHighLightFinished);
    }
    this.selfBoundSpotHighLightFinished = null;

    // if (this.otherBoundSpotHighLight) {
    //   this.otherBoundSpotVGLayer.resetFeatureStyle(this.otherBoundSpotHighLight);
    // }
    // this.otherBoundSpotHighLight = null;

    if (this.selfProjectHighLight) {
      this.selfProjectVGLayer.resetFeatureStyle(this.selfProjectHighLight);
    }
    this.selfProjectHighLight = null;

    // if (this.otherProjectHighLight) {
    //   this.otherProjectVGLayer.resetFeatureStyle(this.otherProjectHighLight);
    // }
    //this.otherProjectHighLight = null;
  };

  //查询数据源构造geojson
  data2GeoJSON(items, type, layer) {
    const { style } = layer;
    let geojson = {};
    let item = null;
    try {
      geojson = {
        type: 'FeatureCollection',
        features: [],
      };
      //构造geojson数据源
      if (items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          item = items[i];
          if (item.SHAPE) {
            // console.log("item",item);
            let properties =
              type === 'spot'
                ? {
                    QDNM: item.QDNM, //图斑
                    PRNM: item.PRNM,
                    BYD: item.BYD,
                    ID: item.ID,
                    PRID: item.PRID,
                    style: style,
                  }
                : type === 'project'
                ? {
                    PRID: item.SWC_P_ID, //项目红线
                    PRO_NAME: item.PRO_NAME,
                    SWC_P_ID: item.SWC_P_ID,
                    style: style,
                  }
                : type === 'label'
                ? {
                    NAME: item.NAME, //标注点
                    ID: item.ID,
                  }
                : {};

            let obj = { type: 'Feature', properties: properties, geometry: JSON.parse(item.SHAPE) };
            geojson.features.push(obj);
          }
        }
      }
    } catch (e) {
      console.error(e, JSON.stringify(item));
    }
    return geojson;
  }

  // 更换关联项目
  changeRelatedProject = item => {
    spot = item;
    Toast.info('请在地图上双击要关联的项目！', 1);
  };

  // 高亮多个图斑
  highlightMultipleSpots = (records, flag) => {
    if (flag) {
      this.highlightSpotList = [];
      if (Array.isArray(records)) {
        records.forEach(record => {
          this.highlightSpot(record);
        });
      }
    } else {
      this.clearHighlightSpots();
    }
  };

  //清空项目红线关联图斑高亮
  clearHighlightSpots() {
    if (Array.isArray(this.highlightSpotList)) {
      this.highlightSpotList.forEach(record => {
        this.unBoundSpotVGLayerUnFinished.resetFeatureStyle(record);
        this.unBoundSpotVGLayerFinished.resetFeatureStyle(record);
        this.selfBoundSpotVGLayerUnFinished.resetFeatureStyle(record);
        this.selfBoundSpotVGLayerFinished.resetFeatureStyle(record);
        // this.otherBoundSpotVGLayer.resetFeatureStyle(record);
      });
    }
  }

  // 高亮单个图斑
  highlightSpot(record) {
    const { QDNM } = record;
    this.highlightSpotList.push(QDNM);
    //根据查询记录判断属于哪个图斑类型图层
    const layer = this.getSpotLayerByRecord(record);
    layer.setFeatureStyle(QDNM, relationHLightstyle);
  }

  /*
   * 添加矢量瓦片项目红线
   */
  async addVectorGridProjects() {
    const {
      login: { user },
    } = this.props;

    // 单位id
    const { dwid } = user;

    // 本单位已监管项目
    // console.time("本单位已监管项目");
    await this.onAddVectorGridProjects(
      // `SUP_UNIT='${dwid}' or SUP_UNIT is null`,
      '',
      this.selfProjectVGLayer,
      100,
      this.selfProjectmarkerCluster,
      this.selfProjectLayerGroup
    );
    // console.timeEnd("本单位已监管项目");

    // 其他单位监管项目
    // console.time("其他单位监管项目");
    // await this.onAddVectorGridProjects(
    //   `SUP_UNIT<>'${dwid}'`,
    //   this.otherProjectVGLayer,
    //   200,
    //   this.otherProjectmarkerCluster,
    //   this.otherProjectLayerGroup
    // );
    // console.timeEnd("其他单位监管项目");
  }

  /*
   * 添加矢量瓦片项目红线图形（查询条件、图斑图层）
   */
  async onAddVectorGridProjects(where, layer, zIndex, clusterlayer, layergroup) {
    const items = await queryProjects({
      where,
      limit: 1000000,
      returnGeometry: true,
    });
    //查询数据源构造geojson
    let geojson = this.data2GeoJSON(items, 'project', layer);
    //console.log("geojson",geojson);
    if (geojson) {
      //加载项目红线聚合图层
      await this.addClusterLayers(geojson, clusterlayer);
      //加载项目红线矢量瓦片图层
      await this.loadProjectVectorLayer(layer, geojson, zIndex, layergroup);
    }
  }

  /*
   * 矢量瓦片扰动图斑绘制函数
   */
  async loadProjectVectorLayer(layer, geojson, zIndex, layergroup) {
    const me = this;
    const { addRelatedProject, cancle, highlightMultipleSpots } = this;
    const { HighLightType, isEdit } = layer;
    //let tepmLayer = layer;
    if (layer) {
      layergroup.removeLayer(layer);
    }
    let data = geojson;
    let obj = {
      rendererFactory: L.svg.tile,
      //rendererFactory: L.canvas.tile,
      vectorTileLayerStyles: { sliced: me.getVectorStyles },
      interactive: true,
      getFeatureId: function(f) {
        return f.properties.PRID;
      },
      maxZoom: config.mapDefault.maxZoom,
      minZoom: config.mapDefault.minZoom,
      zIndex: zIndex,
      HighLightType: HighLightType,
      isEdit: isEdit,
    };
    layer = L.vectorGrid.slicer(data, obj).on('click', function(e) {
      me.clearHighlight();
      switch (layer.options.HighLightType) {
        case 6:
          me.selfProjectHighLight = e.layer.properties.PRID;
          me.selfProjectVGLayer = layer;
          break;
        // case 7:
        //   me.otherProjectHighLight = e.layer.properties.PRID;
        //   me.otherProjectVGLayer = layer;
        //     break;
      }
      layer.setFeatureStyle(e.layer.properties.PRID, highlightstyle);
      //设置图层顺序
      layer.setZIndex(10);
      me.unBoundSpotVGLayerUnFinished.setZIndex(300);
      me.unBoundSpotVGLayerFinished.setZIndex(400);
      me.selfBoundSpotVGLayerUnFinished.setZIndex(500);
      me.selfBoundSpotVGLayerFinished.setZIndex(600);
      // me.otherBoundSpotVGLayer.setZIndex(700);
      me.isShowHighLight = true;

      layer.unbindPopup();
      (async () => {
        let PRID = e.layer.properties.SWC_P_ID;
        const records = await queryProjectById({ id: PRID });
        if (records.length > 0) {
          const elements = me.getProjectPopupContent(records[0], e.latlng, isEdit);
          layer.bindPopup(elements[0], { PRID: PRID }).openPopup(e.latlng);
        }
      })();
    });
    // .addTo(map);
    layer.on('popupopen', e => {
      if (e) {
        let PRID = e.popup.options.PRID;
        (async () => {
          const records = await querySpotByPRIDForMap({ PRID });
          highlightMultipleSpots(records, true);
        })();
      }
    });
    layer.on('popupclose', e => {
      if (e) {
        let PRID = e.popup.options.PRID;
        me.isShowHighLight = false;
        (async () => {
          const records = await querySpotByPRIDForMap({ PRID });
          highlightMultipleSpots(records, false);
        })();
      }
    });
    // 监听双击事件
    // eslint-disable-next-line
    layer.on('dblclick', e => {
      let properties = e.layer.properties;
      if (spot) {
        Modal.alert('提示', `是否绑定 ${properties.PRO_NAME}?`, [
          { text: '取消', onPress: () => cancle() },
          { text: '确定', onPress: () => addRelatedProject(properties.SWC_P_ID) },
        ]);
      }
    });
    //layergroup.removeLayer(tepmLayer).addLayer(layer);
    layergroup.addLayer(layer);
    // switch(layer.options.HighLightType) {
    //   case 6:
    //     me.selfProjectVGLayer = layer;
    //     //console.log('2416',me.selfProjectVGLayer);
    //       break;
    //   case 7:
    //     me.otherProjectVGLayer = layer;
    //     //console.log('2417',me.otherProjectVGLayer);
    //       break;
    // }
  }

  getProjectPopupContent(item, center, isEdit) {
    const { toPopupItemStr } = this;
    // 获取百度坐标
    const latlng = wgs84toBd09LatLng(center);

    // 内容及单击事件
    const elements = jQuery(
      `<div>
      ${toPopupItemStr('项目名称', item.PRO_NAME)}
      ${isEdit ? '<a class="edit">编辑</a>&nbsp;' : '<a class="edit">查看</a>&nbsp;'}
      <a href="bdapp://map/direction?destination=${latlng.lat},${
        latlng.lng
      }&mode=driving">导航</a>&nbsp;
      </div>`
    );
    elements.data('ID', item.SWC_P_ID);
    elements.find('.edit').on('click', () => {
      // 调用编辑页面
      const id = elements.data('ID');
      this.props.dispatch({
        type: 'project/showEditPage',
        payload: {
          selectedId: id,
        },
      });
    });
    return elements;
  }

  // 添加关联项目
  addRelatedProject = PRID => {
    const { ID, QDNM, _v } = spot;
    const record = { ID, PRID, QDNM, _v, OTIME: new Date().getTime() };
    //console.log("record",record);
    this.props.dispatch({
      type: 'spot/saveSpot',
      payload: { record, flag: true },
    });

    // 添加完，将图斑数据清空
    spot = undefined;
  };

  // 点击取消
  cancle = () => {
    // 将图斑数据清空
    spot = undefined;
  };

  // 添加标注点要素
  async addLabelPoints() {
    const me = this;
    const items = await queryLabelPoints({
      limit: 1000000,
      returnGeometry: true,
    });

    //查询数据源构造geojson
    let geojson = this.data2GeoJSON(items, 'label', this.labelPointLayer);
    if (geojson) {
      await this.addLabelClusterLayers(geojson, this.labelPointLayer);
    }
    this.labelPointLayer.on('click', function(e) {
      e.layer.unbindPopup();
      const elements = me.getLabelPopupContent(e.layer, e.layer.options.properties, e.latlng);
      e.layer.bindPopup(elements[0]).openPopup(e.latlng);
    });
  }

  /*
   * 加载标注点聚合图层
   */
  async addLabelClusterLayers(geojson, clusterlayer) {
    let markerList = [];
    for (let i = 0; i < geojson.features.length; i++) {
      let marker = L.marker(
        new L.LatLng(
          geojson.features[i].geometry.coordinates[1],
          geojson.features[i].geometry.coordinates[0]
        ),
        { properties: geojson.features[i].properties }
      );
      markerList.push(marker);
    }
    clusterlayer.addLayers(markerList);
  }

  /*
   * 标注点单击内容函数
   */
  getLabelPopupContent(layer, item, center) {
    const { toPopupItemStr } = this;
    const {
      login: { user },
    } = this.props;
    const me = this;

    // 获取百度坐标
    const latlng = wgs84toBd09LatLng(center);
    // 内容及单击事件
    const elements = jQuery(
      `<div>
        ${toPopupItemStr('标注点名称', item.NAME)}
        <a class="edit">编辑</a>&nbsp;
        <a class="delete">删除</a>&nbsp;
        <a href="bdapp://map/direction?destination=${latlng.lat},${
        latlng.lng
      }&mode=driving">导航</a>&nbsp;
      </div>`
    );
    elements.data('ID', item.ID);

    // 编辑
    elements.find('.edit').on('click', () => {
      // 调用编辑页面
      const id = elements.data('ID');
      me.props.dispatch({
        type: 'labelPoint/showEditPage',
        payload: {
          selectedId: id,
        },
      });
    });

    // 删除
    elements.find('.delete').on('click', () => {
      return new Promise(resolve => {
        Modal.alert('删除', '确定要删除此标注点吗？', [
          {
            text: '取消',
            onPress: () => resolve(false),
          },
          {
            text: '确定',
            onPress: () => {
              const id = elements.data('ID');
              // 移除地图上的图形
              me.removeLabelFeature(layer);
              // 删除点
              me.props.dispatch({
                type: 'labelPoint/deleteLabelPoint',
                payload: {
                  ID: id,
                  DPID: user.userId,
                  DTIME: new Date().getTime(),
                },
              });
              resolve(true);
            },
          },
        ]);
      });
    });
    return elements;
  }

  // 添加单个标注点
  async addLabelPoint(item) {
    //查询数据源构造geojson
    let geojson = this.data2GeoJSON([item], 'label', this.labelPointLayer);
    if (geojson) {
      await this.addLabelClusterLayers(geojson, this.labelPointLayer);
    }
  }

  // -----------------------------------------------------------------------------------------------------
  // 转为popup项
  toPopupItemStr = (name, value) => {
    return value ? `<b>${name}：</b>${value}<br>` : '';
  };

  // -----------------------------------------------------------------------------------------------------
  render() {
    const { loading } = this.state;
    const loadingEl = (
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '90%',
          zIndex: 1000,
        }}
      >
        <ActivityIndicator size="large" />
      </div>
    );

    return (
      <div>
        <NavBar mode="dark">地图</NavBar>
        <NavContentContainer>
          <div id="map" />
        </NavContentContainer>
        {loading ? loadingEl : null}
      </div>
    );
  }
}
