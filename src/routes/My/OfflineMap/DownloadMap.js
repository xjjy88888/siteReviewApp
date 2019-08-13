import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import { Button, Toast } from 'antd-mobile';
import L from 'leaflet';
import styles from './DownloadMap.less';
import { processTileBackground } from '../../../services/tileDownloadManager';
import config from '../../../config';

@connect()
export default class DownloadMap extends PureComponent {
  componentDidMount() {
    const me = this;

    // 创建图层
    me.createLayers();

    // 创建地图
    me.createMap();

    // 创建图层管理控件
    me.createToc();

    // 创建比例尺控件
    me.createScale();
  }

  componentDidUpdate() {
    this.map.invalidateSize();
  }

  handleSubmit = () => {
    // 获取闭包，保留两位小数
    const bounds = this.map.getBounds();
    // console.log(bounds.toBBoxString());
    const bbox = `${this.floor(bounds.getWest(), 2)},${this.floor(
      bounds.getSouth(),
      2
    )},${this.ceil(bounds.getEast(), 2)},${this.ceil(bounds.getNorth(), 2)}`;

    this.props.dispatch({
      type: 'offlineMap/addTileDownloadInfo',
      payload: { bbox },
      callback: exist => {
        if (exist) {
          Toast.info('当前视野范围已存在！', 1);
        } else {
          processTileBackground();
          if (this.props.goToTab) {
            this.props.goToTab(1);
          }
        }
      },
    });
  };

  // 四舍五入
  round = (number, decimal) => {
    const times = 10 ** decimal;
    return Math.round(number * times) / times;
  };

  // 向上舍入
  ceil = (number, decimal) => {
    const times = 10 ** decimal;
    return Math.ceil(number * times) / times;
  };

  // 向下舍入
  floor = (number, decimal) => {
    const times = 10 ** decimal;
    return Math.floor(number * times) / times;
  };

  // 创建图层
  createLayers = () => {
    const { downloadTileOnlineBasemaps } = config;

    // 在线底图
    this.onlineBasemapLayers = downloadTileOnlineBasemaps.map(item => {
      return L.tileLayer(`${item.url}/tile/{z}/{y}/{x}`, {
        minZoom: item.minZoom,
        maxZoom: item.maxZoom,
      });
    });
  };

  // 创建地图
  createMap = () => {
    const { onlineBasemapLayers } = this;
    const {
      mapDefault: { center, zoom },
    } = config;

    const map = L.map('downloadMap', {
      center,
      zoom,
      crs: L.CRS.EPSG3857,
      attributionControl: false,
      layers: [onlineBasemapLayers[0]],
    });
    this.map = map;
  };

  // 创建图层管理控件
  createToc = () => {
    const { map, onlineBasemapLayers } = this;
    const { downloadTileOnlineBasemaps } = config;

    // 底图图层
    const baseMaps = {};
    downloadTileOnlineBasemaps.forEach((item, i) => {
      baseMaps[item.title] = onlineBasemapLayers[i];
    });

    // 专题图层
    const overlayMaps = {};

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

  render() {
    return (
      <Fragment>
        <div id="downloadMap" />
        <div className={styles['btn-download']}>
          <Button type="primary" inline onClick={this.handleSubmit}>
            下载当前视野影像
          </Button>
        </div>
      </Fragment>
    );
  }
}
