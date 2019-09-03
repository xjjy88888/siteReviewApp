import { routerRedux } from 'dva/router';
import { Toast } from 'antd-mobile';
import {
  queryProjectById,
  queryDicts,
  addProject,
  updateProject,
  querySpotsByProjectIdForMap,
  getAllAdminArea,
  queryRelationSpotsById,
} from '../services/localApi';

// 初始状态
const initialState = {
  // 选择项编号
  selectedId: null,

  // 选择项
  selected: null,

  // 类型
  types: null,

  // 查询条件
  where: '',

  // 根据该数值变化判断是否要刷新
  refresh: 0,

  // 涉及县数据
  areaData: '',

  // 行政区划列表
  adminArea: [],

  //  关联ID
  RELATION_ID: [],

  //
  spotsArry: [],
};

export default {
  namespace: 'project',

  state: initialState,

  subscriptions: {
    // eslint-disable-next-line
    setup({ dispatch, history }) {},
  },

  effects: {
    // 显示编辑页面
    // eslint-disable-next-line
    *showEditPage({ payload }, { call, put }) {
      // 将涉及县数据脱离出来
      const id = payload.selectedId;
      let selected = { IVV_CNTY: null };
      if (id) {
        const selectedArr = yield call(queryProjectById, { id });
        [selected] = selectedArr;
      }

      yield put({
        type: 'save',
        payload: { ...payload, selected: null, types: null, areaData: selected.IVV_CNTY },
      });
      yield put(routerRedux.push('/main/index/project-edit'));
    },

    // 从图斑显示项目编辑页面
    // eslint-disable-next-line
    *showEditPageFromSpot({ payload }, { call, put }) {
      yield put({
        type: 'save',
        payload: { ...payload, selected: null, types: null, areaData: null }, // 新建项目时，将areaData数据清空
      });
      yield put(routerRedux.push('/main/index/spot-edit/project-edit'));
    },

    // 显示搜索页面
    // eslint-disable-next-line
    *showSearchPage({ payload }, { call, put }) {
      yield put(routerRedux.push('/main/index/project-search'));
    },

    // 显示地图页面
    // eslint-disable-next-line
    *showMapPage({ payload }, { call, put, select }) {
      const {
        project: { selected },
      } = yield select();
      if (selected && selected.SHAPE) {
        yield put(
          routerRedux.push({
            pathname: '/main/index',
            state: {
              selectedTab: 'map',
              id: selected.SWC_P_ID,
              type: 'project',
            },
          })
        );
      } else {
        // 提示信息
        Toast.info('没有图形，无法定位！', 1);
      }
    },

    // 显示关联图斑编号页面
    // eslint-disable-next-line
    *showRelationSpots({ payload }, { call, put }) {
      yield put(routerRedux.push('/main/index/project-relationSpots'));
    },

    // 查询ID记录
    *queryRecordById({ payload }, { call, put }) {
      const id = payload.selectedId;
      let selected = {};
      let spotsArry = [];
      if (id) {
        const selectedArr = yield call(queryProjectById, { id });
        spotsArry = yield call(queryRelationSpotsById, { id });
        [selected] = selectedArr;
      }

      // 查询所有的行政区划
      const adminArea = yield call(getAllAdminArea, payload);

      const PRO_LEVEL = yield call(queryDicts, { typeName: '立项级别' });
      const PRO_TYPE = yield call(queryDicts, { typeName: '项目类型' });
      const PRO_CATE = yield call(queryDicts, { typeName: '项目类别' });
      const PRO_NAT = yield call(queryDicts, { typeName: '项目性质' });
      const CST_STATE = yield call(queryDicts, { typeName: '建设状态' });
      const VEC_TYPE = yield call(queryDicts, { typeName: '矢量化类型' });
      const XMHGX = yield call(queryDicts, { typeName: '扰动合规性' });
      const types = { PRO_LEVEL, PRO_TYPE, PRO_CATE, PRO_NAT, CST_STATE, VEC_TYPE, XMHGX };

      yield put({
        type: 'save',
        payload: {
          selected,
          types,
          adminArea,
          spotsArry,
        },
      });
    },

    // 查询类型
    // eslint-disable-next-line
    *queryTypes({ payload }, { call, put }) {
      const PRO_LEVEL = yield call(queryDicts, { typeName: '立项级别' });
      const PRO_TYPE = yield call(queryDicts, { typeName: '项目类型' });
      const PRO_CATE = yield call(queryDicts, { typeName: '项目类别' });
      const PRO_NAT = yield call(queryDicts, { typeName: '项目性质' });
      const CST_STATE = yield call(queryDicts, { typeName: '建设状态' });
      const VEC_TYPE = yield call(queryDicts, { typeName: '矢量化类型' });
      const XMHGX = yield call(queryDicts, { typeName: '扰动合规性' });
      const types = { PRO_LEVEL, PRO_TYPE, PRO_CATE, PRO_NAT, CST_STATE, VEC_TYPE, XMHGX };

      yield put({
        type: 'save',
        payload: {
          types,
        },
      });
    },

    // 查询项目
    // eslint-disable-next-line
    *search({ payload }, { call, put }) {
      yield put({
        type: 'save',
        payload,
      });
    },

    // 保存项目
    // eslint-disable-next-line
    *saveProject({ payload, callback }, { call, put, select }) {
      const { isAdd, record } = payload;
      if (isAdd) {
        // 新增
        const result = yield call(addProject, payload);
        const { success, message } = result;
        if (success) {
          yield put({
            type: 'spot/refreshProjectId',
            payload: { PRID: record.SWC_P_ID },
          });

          // 提示信息
          Toast.success('保存成功！', 1);

          // 返回
          yield put({
            type: 'index/goBack',
          });

          // 刷新列表
          yield put({
            type: 'refresh',
          });
        } else {
          Toast.fail(message, 1);
        }
      } else {
        // 修改
        const result = yield call(updateProject, payload);
        const { success, message } = result;
        if (success) {
          // 提示信息
          Toast.success('修改成功！', 1);

          // 返回
          yield put({
            type: 'index/goBack',
          });

          // 刷新列表
          yield put({
            type: 'refresh',
          });

          //新增，刷新保存项目红线信息
          yield put({
            type: 'index/refreshProjects'
          });
          //新增，刷新扰动图斑信息
          yield put({
            type: 'index/refreshSpots'
          });

          // 判断由于监管单位发生改变，是否需要刷新地图上绑定该项目的图斑
          const {
            project: { selected },
          } = yield select();
          if (selected.SUP_UNIT !== record.SUP_UNIT) {
            const records = yield call(querySpotsByProjectIdForMap, {
              id: record.SWC_P_ID,
            });
            yield put({
              type: 'index/refreshMultipleSpots',
              payload: { records },
            });
          }

        } else {
          Toast.fail(message, 1);
        }
      }
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
