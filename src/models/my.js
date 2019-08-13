import { routerRedux } from 'dva/router';
import { queryInstruction } from '../services/localApi';
// import { getInstruction } from '../services/httpApi';
import config from '../config';

const initialState = {
  //
  data: [],

  // 0 第一次下载，1 更新 ，2 不更新
  flag: 0,
};

export default {
  namespace: 'my',

  state: initialState,

  subscriptions: {
    // eslint-disable-next-line
    setup({ dispatch, history }) {},
  },

  effects: {
    // 获取使用说明
    *fetch({ payload }, { call, put }) {
      const instruction = yield call(queryInstruction, payload);
      // const { data: onlineInstruction } = yield call(getInstruction, payload);
      const onlineInstruction = [config.instructionUrl];

      // 如果本地使用说明为空，第一次下载
      if (instruction.length === 0) {
        yield put({
          type: 'save',
          payload: { data: instruction, flag: 0 },
        });
      } else if (instruction.length > 0) {
        // 不为空，与云端数量不一致，提醒更新下载
        if (onlineInstruction.length !== instruction.length) {
          yield put({
            type: 'save',
            payload: { data: instruction, flag: 1 },
          });
          // 不为空，与云端数量一致，比对数据，是否有差异，有则更新
        } else {
          const results = [];
          onlineInstruction.map(item => {
            const difference = instruction.filter(
              ins => ins.FILE_NAME === item.substring(item.lastIndexOf('/') + 1)
            );
            Array.prototype.push.apply(results, difference);
            return results;
          });
          // 不更新
          if (results.length === instruction.length) {
            yield put({
              type: 'save',
              payload: { data: instruction, flag: 2 },
            });
          } else {
            yield put({
              type: 'save',
              payload: { data: instruction, flag: 1 },
            });
          }
        }
      }
    },

    // 显示离线地图页面
    // eslint-disable-next-line
    *showOfflineMap({ payload }, { call, put }) {
      yield put(routerRedux.push('/main/index/offline-map'));
    },

    // 显示数据同步页面
    // eslint-disable-next-line
    *showDataSync({ payload }, { call, put }) {
      yield put(routerRedux.push('/main/index/data-sync'));
    },

    // 显示附件同步页面
    // eslint-disable-next-line
    *showAttachmentSync({ payload }, { call, put }) {
      yield put(routerRedux.push('/main/index/attachment-sync'));
    },

    // 显示建设单位页面
    // eslint-disable-next-line
    *showCsUnitPage({ payload }, { call, put }) {
      yield put(routerRedux.push('/main/index/csUnit'));
    },

    // 显示使用说明页面
    // eslint-disable-next-line
    *showInstructionPage({ payload }, { call, put }) {
      yield put(routerRedux.push('/main/index/instruction'));
    },

    // 显示使用说明下载页面
    // eslint-disable-next-line
    *showDownloadInstruction({ payload }, { call, put }) {
      yield put(routerRedux.push('/main/index/download-instruction'));
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
