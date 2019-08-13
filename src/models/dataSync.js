import {
  querySpotsCount,
  queryProjectsCount,
  queryDictsCount,
  queryAdminAreasCount,
  queryDeptsCount,
  queryCsUnitsCount,
  queryPhotoPointsCount,
  queryLabelPointsCount,
  querySpotsModifyCounts,
  queryProjectsModifyCounts,
  queryCsUnitsModifyCounts,
  queryPhotoPointsModifyCounts,
  queryLabelPointsModifyCounts,
} from '../services/localApi';
import {
  agsQueryForCount,
  queryDicts,
  queryAdminAreas,
  queryDepts,
  queryCsUnits,
  queryProjectsApi,
  querySpotsApi,
  queryPointsApi,
} from '../services/httpApi';
import config from '../config';
import { getRegionCondition } from '../utils/util';

// 获取在线数量
function* queryOnlineCounts({ call, select }) {
  const {
    login: { user },
  } = yield select();

  // 获取在线图斑数量
  const { data: onlineSpotsCount } = yield call(querySpotsApi, true);
  // const {
  //   data: { count: onlineSpotsCount },
  // } = yield call(agsQueryForCount, {
  //   url: `${config.spotLayerUrl}/query`,
  //   params: { where: getRegionCondition(user, 'XZQDM') },
  // });

  // 获取在线项目数量
  const { data: onlineProjectsCount } = yield call(queryProjectsApi, true);
  // const onlineProjectsCount = projectRecords.length;
  // （1）获取在线有图形项目数量
  // const {
  //   data: { count: onlineHasGeometryProjectsCount },
  // } = yield call(agsQueryForCount, {
  //   url: `${config.projectLayerUrl}/query`,
  //   params: {
  //     where: [`(${getRegionCondition(user, 'NJHT_DB.SWC_PROJECT_INFO.IVV_CNTY')})`].join(' and '),
  //   },
  // });

  // （2）获取在线无图形项目数量
  // const { data: onlineNoGeometryProjects } = yield call(queryProjects, {
  //   where: [`(${getRegionCondition(user, 'IVV_CNTY')})`, 'TXID is null'].join(' and '),
  // });
  // const onlineProjectsCount = onlineHasGeometryProjectsCount + onlineNoGeometryProjects.length;

  // 获取在线字典数量
  const { data: onlineDictsCount } = yield call(queryDicts, true);
  // const onlineDictsCount = dictRecords.length;

  // 获取在线行政区划数量
  const { data: onlineAdminAreasCount } = yield call(queryAdminAreas, true);
  // const onlineAdminAreasCount = adminAreas.length;

  // 获取在线部门数量
  const { data: onlineDeptsCount } = yield call(queryDepts, true);
  // const onlineDeptsCount = depts.length;

  // 获取在线建设单位数量
  const { data: onlineCsUnitsCount } = yield call(queryCsUnits, true);
  // const onlineCsUnitsCount = csUnits.length;

  // 获取在线照片点数量
  // const {
  //   data: { count: onlinePhotoPointsCount },
  // } = yield call(agsQueryForCount, {
  //   url: `${config.photoPointLayerUrl}/query`,
  //   params: { where: `MDID='${user.dwid}'` },
  // });

  // 获取在线标注点数量
  const { data: onlineLabelPointsCount } = yield call(queryPointsApi, true);
  // const onlineLabelPointsCount = pointRecords.length;
  // const {
  //   data: { count: onlineLabelPointsCount },
  // } = yield call(agsQueryForCount, {
  //   url: `${config.labelPointLayerUrl}/query`,
  //   params: { where: `MDID='${user.dwid}'` },
  // });

  return {
    onlineSpotsCount,
    onlineProjectsCount,
    onlineDictsCount,
    onlineAdminAreasCount,
    onlineDeptsCount,
    onlineCsUnitsCount,
    // onlinePhotoPointsCount,
    onlineLabelPointsCount,
  };
}

// 获取本地数量
function* queryLocalCounts({ call }) {
  // 获取本地图斑数量
  const localSpotsCount = yield call(querySpotsCount);

  // 获取本地项目数量
  const localProjectsCount = yield call(queryProjectsCount);

  // 获取本地字典数量
  const localDictsCount = yield call(queryDictsCount);

  // 获取本地行政区划数量
  const localAdminAreasCount = yield call(queryAdminAreasCount);

  // 获取本地部门数量
  const localDeptsCount = yield call(queryDeptsCount);

  // 获取本地建设单位数量
  const localCsUnitsCount = yield call(queryCsUnitsCount);

  // 获取本地照片点数量
  const localPhotoPointsCount = yield call(queryPhotoPointsCount);

  // 获取本地标注点数量
  const localLabelPointsCount = yield call(queryLabelPointsCount);

  // 获取图斑修改数量
  const { addSpotsCount, updateSpotsCount, deleteSpotsCount } = yield call(querySpotsModifyCounts);

  // 获取项目修改数量
  const { addProjectsCount, updateProjectsCount, deleteProjectsCount } = yield call(
    queryProjectsModifyCounts
  );

  // 获取建设单位修改数量
  const { addCsUnitsCount, updateCsUnitsCount, deleteCsUnitsCount } = yield call(
    queryCsUnitsModifyCounts
  );

  // 获取照片点修改数量
  const { addPhotoPointsCount, updatePhotoPointsCount, deletePhotoPointsCount } = yield call(
    queryPhotoPointsModifyCounts
  );

  // 获取标注点修改数量
  const { addLabelPointsCount, updateLabelPointsCount, deleteLabelPointsCount } = yield call(
    queryLabelPointsModifyCounts
  );

  return {
    localSpotsCount,
    localProjectsCount,
    localDictsCount,
    localAdminAreasCount,
    localDeptsCount,
    localCsUnitsCount,
    localPhotoPointsCount,
    localLabelPointsCount,
    addSpotsCount,
    updateSpotsCount,
    deleteSpotsCount,
    addProjectsCount,
    updateProjectsCount,
    deleteProjectsCount,
    addCsUnitsCount,
    updateCsUnitsCount,
    deleteCsUnitsCount,
    addPhotoPointsCount,
    updatePhotoPointsCount,
    deletePhotoPointsCount,
    addLabelPointsCount,
    updateLabelPointsCount,
    deleteLabelPointsCount,
  };
}

// 初始状态
const initialState = {
  // 在线+离线数量
  onlineSpotsCount: 0,
  localSpotsCount: 0,
  onlineProjectsCount: 0,
  localProjectsCount: 0,
  onlineDictsCount: 0,
  localDictsCount: 0,
  onlineAdminAreasCount: 0,
  localAdminAreasCount: 0,
  onlineDeptsCount: 0,
  localDeptsCount: 0,
  onlineCsUnitsCount: 0,
  localCsUnitsCount: 0,
  // onlinePhotoPointsCount: 0,
  localPhotoPointsCount: 0,
  onlineLabelPointsCount: 0,
  localLabelPointsCount: 0,

  // 增删改数量
  addSpotsCount: 0,
  updateSpotsCount: 0,
  deleteSpotsCount: 0,
  addProjectsCount: 0,
  updateProjectsCount: 0,
  deleteProjectsCount: 0,
  addCsUnitsCount: 0,
  updateCsUnitsCount: 0,
  deleteCsUnitsCount: 0,
  addPhotoPointsCount: 0,
  updatePhotoPointsCount: 0,
  deletePhotoPointsCount: 0,
  addLabelPointsCount: 0,
  updateLabelPointsCount: 0,
  deleteLabelPointsCount: 0,
};

export default {
  namespace: 'dataSync',

  state: initialState,

  subscriptions: {
    // eslint-disable-next-line
    setup({ dispatch, history }) {},
  },

  effects: {
    // 查询在线和离线数量
    // eslint-disable-next-line
    *queryAllCounts({ payload }, { call, put, select }) {
      const [result1, result2] = yield [
        call(queryOnlineCounts, { call, select }),
        call(queryLocalCounts, { call }),
      ];

      yield put({
        type: 'save',
        payload: { ...result1, ...result2 },
      });
    },

    // 获取在线数量
    // eslint-disable-next-line
    *queryOnlineCounts({ payload }, { call, put, select }) {
      const result = yield call(queryOnlineCounts, { call, select });

      yield put({
        type: 'save',
        payload: result,
      });
    },

    // 获取本地数量
    // eslint-disable-next-line
    *queryLocalCounts({ payload }, { call, put }) {
      const result = yield call(queryLocalCounts, { call });

      yield put({
        type: 'save',
        payload: result,
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
