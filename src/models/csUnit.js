import { Toast } from 'antd-mobile';
import { queryCsUnitById, addCsUnit, updateCsUnit } from '../services/localApi';

// 初始状态
const initialState = {
  // 查询条件
  where: '',

  // 根据该数值变化判断是否要刷新
  refresh: 0,
};

export default {
  namespace: 'csUnit',

  state: initialState,

  subscriptions: {
    // eslint-disable-next-line
    setup({ dispatch, history }) {},
  },

  effects: {
    // 查询ID记录
    *queryRecordById({ payload, callback }, { call }) {
      const selectedArr = yield call(queryCsUnitById, { id: payload.selectedId });
      const [selected] = selectedArr;

      if (callback) callback(selected);
    },

    // 查询建设单位
    // eslint-disable-next-line
    *search({ payload }, { call, put }) {
      yield put({
        type: 'save',
        payload,
      });
    },

    // 保存添加的建设单位
    *saveAddCsUnit({ payload, callback }, { call, put }) {
      const result = yield call(addCsUnit, payload);
      const { success } = result;

      if (success) {
        // 提示信息
        Toast.success('保存成功！', 1);

        // 刷新列表
        yield put({
          type: 'refresh',
        });
      }

      if (callback) callback(result);
    },

    // 保存修改的建设单位
    *saveUpdateCsUnit({ payload, callback }, { call, put }) {
      const result = yield call(updateCsUnit, payload);
      const { success } = result;

      if (success) {
        // 提示信息
        Toast.success('保存成功！', 1);

        // 刷新列表
        yield put({
          type: 'refresh',
        });
      }

      if (callback) callback(result);
    },

    // eslint-disable-next-line
    *refresh({ payload }, { call, put }) {
      yield put({
        type: 'save',
        payload: { refresh: new Date().getTime() },
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

    clear() {
      return initialState;
    },
  },
};
