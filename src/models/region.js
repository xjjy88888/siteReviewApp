import { routerRedux } from 'dva/router';
import { queryRegions } from '../services/localApi';

export default {
  namespace: 'region',

  state: {
    data: [],

    // 选择项
    selected: null,
  },

  subscriptions: {
    // eslint-disable-next-line
    setup({ dispatch, history }) {},
  },

  effects: {
    // 获取数据
    *fetch({ payload }, { call, put }) {
      const response = yield call(queryRegions, payload);
      yield put({
        type: 'save',
        payload: { data: response },
      });
    },

    // 显示index页面
    // eslint-disable-next-line
    *showIndex({ payload }, { call, put }) {
      yield put(
        routerRedux.push({
          pathname: '/main/index',
          state: payload,
        })
      );
      yield put({
        type: 'save',
        payload,
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
