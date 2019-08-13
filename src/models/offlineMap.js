import {
  queryTileDownloadInfos,
  isTileDownloadInfoExist,
  addTileDownloadInfo,
  updateTileDownloadInfo,
  removeTileDownloadInfo,
  queryTileDeleteInfos,
} from '../services/localApi';

export default {
  namespace: 'offlineMap',

  state: {
    // 瓦片下载信息列表
    tileDownloadInfos: [],

    // 瓦片删除信息列表
    tileDeleteInfos: [],
  },

  subscriptions: {
    // eslint-disable-next-line
    setup({ dispatch, history }) {},
  },

  effects: {
    // 获取瓦片下载信息列表
    *queryTileDownloadInfos({ payload }, { call, put }) {
      const response = yield call(queryTileDownloadInfos, payload);
      yield put({
        type: 'save',
        payload: { tileDownloadInfos: response },
      });
    },

    // 添加瓦片下载信息
    // eslint-disable-next-line
    *addTileDownloadInfo({ payload, callback }, { call, put }) {
      // 如果该bbox不存在，则添加
      const response = yield call(isTileDownloadInfoExist, payload);
      if (!response) {
        yield call(addTileDownloadInfo, payload);
        yield put({
          type: 'queryTileDownloadInfos',
          payload,
        });
      }
      if (callback) callback(response);
    },

    // 更新瓦片下载信息
    // eslint-disable-next-line
    *updateTileDownloadInfo({ payload }, { call, put }) {
      yield call(updateTileDownloadInfo, payload);
      yield put({
        type: 'queryTileDownloadInfos',
        payload,
      });
    },

    // 移除瓦片下载信息
    // eslint-disable-next-line
    *removeTileDownloadInfo({ payload }, { call, put }) {
      yield call(removeTileDownloadInfo, payload);
      yield put({
        type: 'queryTileDownloadInfos',
        payload,
      });
      yield put({
        type: 'queryTileDeleteInfos',
        payload,
      });
    },

    // 获取瓦片删除信息列表
    *queryTileDeleteInfos({ payload }, { call, put }) {
      const response = yield call(queryTileDeleteInfos, payload);
      yield put({
        type: 'save',
        payload: { tileDeleteInfos: response },
      });
    },
  },

  reducers: {
    save(state, action) {
      return {
        ...state,
        ...action.payload,
      };
    },
  },
};
