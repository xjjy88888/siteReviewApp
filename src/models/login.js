import { routerRedux } from 'dva/router';
import { Toast } from 'antd-mobile';
import { getVersionNumber } from '@/utils/version.js';
import { login } from '../services/httpApi';
import {
  login as localLogin,
  saveUserInfo,
  initUserDB,
  closeUserDB,
  getLastLandUser,
} from '../services/localApi';

// 登录成功
function* onLoginSuccess({ call, put }, { isOnline, user }) {
  // 提示信息
  Toast.success('登录成功！', 1);

  // 修改状态
  yield put({
    type: 'save',
    payload: { status: true, user },
  });

  // 在线，则保存登录信息进数据库
  // if (isOnline) {
  yield call(saveUserInfo, user);
  // }

  // 初始化用户数据库
  yield call(initUserDB, user.userName);

  // 切换路由
  yield put(routerRedux.replace('/main/index'));
}

// 登录失败
function* onLoginFail({ put }) {
  // 提示信息
  Toast.fail('用户名或密码错误！', 1);

  // 修改状态
  yield put({
    type: 'save',
    payload: { status: false, user: {} },
  });
}

// 清除状态
function* onClearStates({ put }) {
  yield put({ type: 'attachmentSync/clear' });
  yield put({ type: 'dataSync/clear' });
  yield put({ type: 'spot/clear' });
  yield put({ type: 'project/clear' });
  yield put({ type: 'csUnit/clear' });
}

export default {
  namespace: 'login',

  state: {
    // 登录状态
    status: false,

    // 用户信息
    user: {},

    // 应用版本号
    appVersionNumber: '',

    // 默认不记住用户密码
    isReserve: false,
  },

  subscriptions: {
    // eslint-disable-next-line
    setup({ dispatch, history }) {},
  },

  effects: {
    // 获取应用版本号及上次登陆的用户信息
    // eslint-disable-next-line
    *getAppVersionNumberandUser({ payload }, { call, put }) {
      const appVersionNumber = yield call(getVersionNumber);
      const [lastLandUser] = yield call(getLastLandUser);

      let user = { userName: '', password: '' };
      let isReserve = false;
      if (lastLandUser) {
        if (lastLandUser.isReserve === 1) {
          user = { userName: lastLandUser.userName, password: lastLandUser.password };
          isReserve = true;
        }
      }
      yield put({
        type: 'save',
        payload: { appVersionNumber, user, isReserve },
      });
    },

    // 登录
    // eslint-disable-next-line
    *login({ payload }, { call, put }) {
      const response = yield call(login, payload);

      // 取出是否保留和登陆时间以及没有加密过的密码
      const { isReserve, landTime, password } = payload;
      if (response.err && !response.err.response) {
        // 网络问题，则离线登录
        const localLoginResult = yield call(localLogin, payload);
        console.log('离线登录', response, localLoginResult);
        if (localLoginResult.length > 0) {
          // 登录成功
          const loginUser = { ...localLoginResult[0], isReserve, landTime, password };
          yield call(onLoginSuccess, { call, put }, { isOnline: false, user: loginUser });
        } else {
          // 登录失败
          yield call(onLoginFail, { call, put });
        }
      } else {
        console.log('在线登录', response);
        if (response.err) {
          // 登录失败
          yield call(onLoginFail, { call, put });
        } else {
          // 登录成功
          const {
            data: { result },
          } = response;
          const loginUser = {
            ...result,
            isReserve,
            landTime,
            password,
            dwdm: result.displayArea,
            dwid: result.departmentId,
            dwmc: payload.departmentName,
            fsdm: '0000',
            trueName: result.displayName,
            userName: payload.username,
          };
          localStorage.setItem('user', JSON.stringify(result));
          yield call(onLoginSuccess, { call, put }, { isOnline: true, user: loginUser });
        }
      }
    },

    // 登出
    // eslint-disable-next-line
    *logout({ payload }, { call, put }) {
      // 修改状态
      yield put({
        type: 'save',
        payload: { status: false, user: {} },
      });

      // 关闭用户数据库
      yield call(closeUserDB);

      // 清除状态
      yield call(onClearStates, { put });

      // 切换路由
      yield put(routerRedux.replace('/login'));
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
