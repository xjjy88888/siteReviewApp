import React, { PureComponent } from 'react';
import { connect } from 'dva';
import L from 'leaflet';
import './DownloadResultMap.less';
import isCordova from '../../../utils/cordova';
import config from '../../../config';

@connect()
export default class DownloadResultMap extends PureComponent {
  componentDidMount() {
    const me = this;

    // 创建图层
    me.createLayers();

    // 创建地图
    me.createMap();

    // 创建比例尺控件
    me.createScale();
  }

  componentDidUpdate() {
    this.map.invalidateSize();
  }

  // 创建图层
  createLayers = () => {
    const { offlineBasemap } = config;

    // 离线底图
    if (isCordova()) {
      // 自己发布的影像瓦片图层（离线）
      const myOfflineImageLayer = L.tileLayerCordova(
        `${offlineBasemap.url}/tile/{z}/{y}/{x}`,
        {
          minZoom: offlineBasemap.minZoom,
          maxZoom: offlineBasemap.maxZoom,
          folder: offlineBasemap.folder,
          name: offlineBasemap.name,
          debug: offlineBasemap.debug,
        },
        () => myOfflineImageLayer.goOffline()
      );
      this.myOfflineImageLayer = myOfflineImageLayer;
    } else {
      // 自己发布的影像瓦片图层（使用在线地图模拟离线地图）
      const myOfflineImageLayer = L.tileLayer(`${offlineBasemap.url}/tile/{z}/{y}/{x}`, {
        minZoom: offlineBasemap.minZoom,
        maxZoom: offlineBasemap.maxZoom,
      });
      this.myOfflineImageLayer = myOfflineImageLayer;
    }
  };

  // 创建地图
  createMap = () => {
    const { myOfflineImageLayer } = this;
    const {
      mapDefault: { center, zoom },
    } = config;

    const map = L.map('downloadResultMap', {
      center,
      zoom,
      crs: L.CRS.EPSG3857,
      attributionControl: false,
      layers: [myOfflineImageLayer],
    });
    this.map = map;
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

  render() {
    return <div id="downloadResultMap" />;
  }
}
