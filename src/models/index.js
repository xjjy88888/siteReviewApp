import { routerRedux } from 'dva/router';

export default {
  namespace: 'index',

  state: {
    // 根据该数值变化判断是否要刷新所有地图要素
    refreshAllFeatures: 0,

    // 根据该数值变化判断是否要刷新地图图斑
    refreshSpots: 0,

    // 根据该数值变化判断是否要刷新地图项目
    refreshProjects: 0,

    // 根据该数值变化判断是否要刷新地图照片点
    refreshPhotoPoints: 0,

    // 根据该数值变化判断是否要刷新地图标注点
    refreshLabelPoints: 0,

    addPhotoPointToMap: null,

    addLabelPointToMap: null,

    refreshMultipleSpots: null,
  },

  subscriptions: {
    // eslint-disable-next-line
    setup({ dispatch, history }) {},
  },

  effects: {
    // eslint-disable-next-line
    *goBack({ payload }, { call, put }) {
      yield put(routerRedux.goBack());
    },

    // 刷新所有地图要素
    // eslint-disable-next-line
    *refreshAllFeatures({ payload }, { call, put }) {
      yield put({
        type: 'save',
        payload: { refreshAllFeatures: new Date().getTime() },
      });
    },

    // 刷新图斑列表
    // eslint-disable-next-line
    *refreshSpots({ payload }, { call, put }) {
      yield put({
        type: 'save',
        payload: { refreshSpots: new Date().getTime() },
      });
    },

    // 刷新项目列表
    // eslint-disable-next-line
    *refreshProjects({ payload }, { call, put }) {
      yield put({
        type: 'save',
        payload: { refreshProjects: new Date().getTime() },
      });
    },

    // 刷新照片点列表
    // eslint-disable-next-line
    *refreshPhotoPoints({ payload }, { call, put }) {
      yield put({
        type: 'save',
        payload: { refreshPhotoPoints: new Date().getTime() },
      });
    },

    // 刷新标注点列表
    // eslint-disable-next-line
    *refreshLabelPoints({ payload }, { call, put }) {
      yield put({
        type: 'save',
        payload: { refreshLabelPoints: new Date().getTime() },
      });
    },

    // 添加单个照片点到地图上
    // eslint-disable-next-line
    *addPhotoPointToMap({ payload }, { call, put }) {
      const { record } = payload;
      yield put({
        type: 'save',
        payload: { addPhotoPointToMap: record },
      });
    },

    // 添加单个标注点到地图上
    // eslint-disable-next-line
    *addLabelPointToMap({ payload }, { call, put }) {
      const { record } = payload;
      yield put({
        type: 'save',
        payload: { addLabelPointToMap: record },
      });
    },

    // 刷新多个图斑
    // eslint-disable-next-line
    *refreshMultipleSpots({ payload }, { call, put }) {
      const { records } = payload;
      yield put({
        type: 'save',
        payload: { refreshMultipleSpots: records },
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
