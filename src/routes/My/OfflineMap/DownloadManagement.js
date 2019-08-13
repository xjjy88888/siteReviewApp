import React, { PureComponent, Fragment } from 'react';
import { WhiteSpace, List, Modal } from 'antd-mobile';
import { connect } from 'dva';
import DeletingItem from '../../../components/TileDownload/DeletingItem';
import DownloadedItem from '../../../components/TileDownload/DownloadedItem';
import DownloadingItem from '../../../components/TileDownload/DownloadingItem';
import PausedItem from '../../../components/TileDownload/PausedItem';
import {
  setProcessTileCallback,
  processTileBackground,
} from '../../../services/tileDownloadManager';

@connect(({ offlineMap }) => ({
  offlineMap,
}))
export default class DownloadManagement extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedItemId: null,
    };
  }

  componentDidMount() {
    // 查询瓦片下载信息列表
    this.queryTileDownloadInfos();

    // 查询瓦片删除信息列表
    this.queryTileDeleteInfos();

    // 设置瓦片下载回调函数
    setProcessTileCallback(this.processTilePercentCallback, this.processTileCompletedCallback);
  }

  onItemClick = item => {
    let id = null;
    if (item.id !== this.state.selectedItemId) {
      ({ id } = item);
    }
    this.setState({
      selectedItemId: id,
    });
  };

  onItemButtonClick = (type, item) => {
    switch (type) {
      case 'start':
        this.updateTileDownloadInfoState(item, 0);
        processTileBackground();
        break;
      case 'pause':
        this.updateTileDownloadInfoState(item, 1);
        processTileBackground();
        break;
      case 'delete':
        if (item.percent === 0) {
          this.removeTileDownloadInfo(item);
          processTileBackground();
        } else {
          Modal.alert('删除', '删除后该区域内的离线影像会一同被删除，确定要删除吗？', [
            { text: '取消', onPress: () => console.log('取消') },
            {
              text: '确定',
              onPress: () => {
                this.removeTileDownloadInfo(item);
                processTileBackground();
              },
            },
          ]);
        }
        break;
      default:
        break;
    }
  };

  // 瓦片下载进度回调函数
  processTilePercentCallback = (id, type) => {
    // 查询瓦片下载信息列表
    this.queryTileDownloadInfos();

    // 查询瓦片删除信息列表
    this.queryTileDeleteInfos();

    const {
      offlineMap: { tileDownloadInfos, tileDeleteInfos },
    } = this.props;

    if (type === 'download') {
      // 判断是否要暂停下载（有删除记录需要停止下载，暂停和删除都需要停止下载）
      if (tileDeleteInfos.length > 0) {
        return false;
      } else {
        const items = tileDownloadInfos.filter(item => item.id === id);
        if (items.length > 0) {
          if (items[0].isPaused === 1) {
            return false;
          }
        } else {
          return false;
        }
      }
    }
  };

  // 瓦片下载完成回调函数
  processTileCompletedCallback = () => {
    // 查询瓦片下载信息列表
    this.queryTileDownloadInfos();

    // 查询瓦片删除信息列表
    this.queryTileDeleteInfos();
  };

  // 查询瓦片下载信息列表
  queryTileDownloadInfos = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'offlineMap/queryTileDownloadInfos',
    });
  };

  // 更新瓦片下载信息状态
  updateTileDownloadInfoState = (item, isPaused) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'offlineMap/updateTileDownloadInfo',
      payload: {
        id: item.id,
        isPaused,
      },
    });
  };

  // 移除瓦片下载信息
  removeTileDownloadInfo = item => {
    const { dispatch } = this.props;
    dispatch({
      type: 'offlineMap/removeTileDownloadInfo',
      payload: {
        id: item.id,
      },
    });
  };

  // 查询瓦片删除信息列表
  queryTileDeleteInfos = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'offlineMap/queryTileDeleteInfos',
    });
  };

  renderDeletingList = dataSource => {
    const items = dataSource;
    return <List>{items.map(this.renderDeletingItem)}</List>;
  };

  renderDownloadingList = dataSource => {
    const items = dataSource.filter(item => item.isFinished !== 1);
    return <List>{items.map(this.renderDownloadingItem)}</List>;
  };

  renderDownloadedList = dataSource => {
    const items = dataSource.filter(item => item.isFinished === 1);
    return <List>{items.map(this.renderDownloadedItem)}</List>;
  };

  renderDeletingItem = item => {
    return <DeletingItem key={item.id} dataSource={item} />;
  };

  renderDownloadingItem = item => {
    if (item.isPaused === 1) {
      return (
        <PausedItem
          key={item.id}
          dataSource={item}
          expand={this.state.selectedItemId === item.id}
          onClick={this.onItemClick}
          onButtonClick={this.onItemButtonClick}
        />
      );
    } else {
      return (
        <DownloadingItem
          key={item.id}
          dataSource={item}
          expand={this.state.selectedItemId === item.id}
          onClick={this.onItemClick}
          onButtonClick={this.onItemButtonClick}
        />
      );
    }
  };

  renderDownloadedItem = item => {
    return (
      <DownloadedItem
        key={item.id}
        dataSource={item}
        expand={this.state.selectedItemId === item.id}
        onClick={this.onItemClick}
        onButtonClick={this.onItemButtonClick}
      />
    );
  };

  render() {
    /*
    const {
      offlineMap: { tileDownloadInfos, tileDeleteInfos },
    } = this.props;
    */
    const {
      offlineMap: { tileDownloadInfos },
    } = this.props;
    return (
      <Fragment>
        {/* <WhiteSpace />
        正在删除
        <WhiteSpace />
        {this.renderDeletingList(tileDeleteInfos)} */}
        <WhiteSpace />
        正在下载
        <WhiteSpace />
        {this.renderDownloadingList(tileDownloadInfos)}
        <WhiteSpace />
        下载完成
        <WhiteSpace />
        {this.renderDownloadedList(tileDownloadInfos)}
      </Fragment>
    );
  }
}
