import { routerRedux } from 'dva/router';
import { Toast } from 'antd-mobile';
import {
  querySpotById,
  querySpotByIdForMap,
  queryDicts,
  updateSpot,
  queryAttachmentsByRelationId,
  editAttachments,
  queryAttachmentsCount,
  queryAttachmentsModifyCounts,
  getAllAdminArea,
} from '../services/localApi';
import { queryAttachments } from '../services/httpApi';

// 获取在线数量
function* queryOnlineCounts({ call, select }) {
  const {
    spot: { id },
  } = yield select();
  // 在线图斑图片数量
  const onlineSpotImagesCount = yield call(queryOnlineAttachmentsCount, { id });
  return {
    onlineSpotImagesCount,
  };
}

// 根据id查询在线附件数量
async function queryOnlineAttachmentsCount(id) {
  const { data: items } = await queryAttachments({ id: id, soucre: 'spot' });
  let count = 0;
  for (const key in items) {
    if ({}.hasOwnProperty.call(items, key)) {
      count += items[key].length;
    }
  }
  return count;
}

// 获取本地数量
function* queryLocalCounts({ call, select }) {
  const {
    spot: { id },
  } = yield select();
  // 图斑图片
  const localSpotImagesCount = yield call(queryAttachmentsCount, {
    where: `RELATION_ID = '${id}'`,
  });
  const {
    addAttachmentsCount: addSpotImagesCount,
    updateAttachmentsCount: updateSpotImagesCount,
    deleteAttachmentsCount: deleteSpotImagesCount,
  } = yield call(queryAttachmentsModifyCounts, { where: `RELATION_ID = '${id}'` });

  return {
    localSpotImagesCount,
    addSpotImagesCount,
    updateSpotImagesCount,
    deleteSpotImagesCount,
  };
}

// 初始状态
const initialState = {
  // 选择项编号
  selectedId: null,

  // 选择项
  selected: null,

  // 新增项目编号
  PRID: null,

  // 图片
  imageInfos: [],

  // 类型
  types: null,

  // 查询条件
  where: '',

  // 根据该数值变化判断是否要刷新
  refresh: 0,

  // 选择同步照片的图斑编号
  id: '',

  // 图斑图片
  onlineSpotImagesCount: 0,
  localSpotImagesCount: 0,
  addSpotImagesCount: 0,
  updateSpotImagesCount: 0,
  deleteSpotImagesCount: 0,

  // 涉及县数据
  areaData: '',

  // 行政区划列表
  adminArea: [],

  // 图片是否可编辑
  editable: true,
};

export default {
  namespace: 'spot',

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
      const selectedArr = yield call(querySpotById, { id: payload.selectedId });
      const [selected] = selectedArr;

      yield put({
        type: 'save',
        payload: { ...payload, selected: null, types: null, PRID: null, areaData: selected.XZQDM },
      });
      yield put(routerRedux.push('/main/index/spot-edit'));
    },

    // 显示搜索页面
    // eslint-disable-next-line
    *showSearchPage({ payload }, { call, put }) {
      yield put(routerRedux.push('/main/index/spot-search'));
    },

    // 显示图斑照片同步页面
    // eslint-disable-next-line
    *showImageSyncPage({ payload }, { call, put }) {
      yield put({
        type: 'save',
        payload,
      });
      yield put(routerRedux.push('/main/index/spot-imageSync'));
    },

    // 显示图斑照片页面
    // eslint-disable-next-line
    *showPicturePage({ payload }, { call, put }) {
      yield put({
        type: 'save',
        payload,
      });
      yield put(routerRedux.push('/main/index/spot-picture'));
    },

    // 照片页面返回，清空图片信息
    // eslint-disable-next-line
    *pictureBack({ payload }, { call, put }) {
      yield put({
        type: 'save',
        payload,
      });
      // 返回
      yield put({
        type: 'index/goBack',
      });
    },

    // 查询在线和离线数量
    // eslint-disable-next-line
    *queryAllCounts({ payload }, { call, put, select }) {
      const [result1, result2] = yield [
        call(queryOnlineCounts, { call, select }),
        call(queryLocalCounts, { call, select }),
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

    // 显示地图页面
    // eslint-disable-next-line
    *showMapPage({ payload }, { call, put, select }) {
      const {
        spot: { selected },
      } = yield select();
      if (selected && selected.SHAPE) {
        yield put(
          routerRedux.push({
            pathname: '/main/index',
            state: {
              selectedTab: 'map',
              id: selected.ID,
              type: 'spot',
            },
          })
        );
      } else {
        // 提示信息
        Toast.info('没有图形，无法定位！', 1);
      }
    },

    // 查询ID记录
    *queryRecordById({ payload }, { call, put }) {
      const selectedArr = yield call(querySpotById, { id: payload.selectedId });
      const [selected] = selectedArr;

      // 查询所有的行政区划
      const adminArea = yield call(getAllAdminArea, payload);

      // 类型
      const QTYPE = yield call(queryDicts, { typeName: '扰动类型' });
      const QDCS = yield call(queryDicts, { typeName: '建设状态' });
      const QDTYPE = yield call(queryDicts, { typeName: '扰动变化类型' });
      const BYD = yield call(queryDicts, { typeName: '扰动合规性' });
      const SEROSION = yield call(queryDicts, { typeName: '土壤侵蚀强度' });
      const types = { QTYPE, QDCS, QDTYPE, BYD, SEROSION };

      // 项目编号
      const { PRID } = selected || {};

      // 图片
      const imageInfos = yield call(queryAttachmentsByRelationId, { id: payload.selectedId });
      yield put({
        type: 'save',
        payload: {
          selected,
          PRID,
          types,
          adminArea,
          imageInfos,
        },
      });
    },

    // 根据ID查询图片信息
    *queryImageInfosById({ payload }, { call, put }) {
      // 图片
      const imageInfos = yield call(queryAttachmentsByRelationId, { id: payload.selectedId });
      yield put({
        type: 'save',
        payload: {
          imageInfos,
        },
      });
    },

    // 查询类型
    // eslint-disable-next-line
    *queryTypes({ payload }, { call, put }) {
      const QTYPE = yield call(queryDicts, { typeName: '扰动类型' });
      const QDCS = yield call(queryDicts, { typeName: '建设状态' });
      const QDTYPE = yield call(queryDicts, { typeName: '扰动变化类型' });
      const BYD = yield call(queryDicts, { typeName: '扰动合规性' });
      const SEROSION = yield call(queryDicts, { typeName: '土壤侵蚀强度' });
      const types = { QTYPE, QDCS, QDTYPE, BYD, SEROSION };

      yield put({
        type: 'save',
        payload: {
          types,
        },
      });
    },

    // 查询图斑
    // eslint-disable-next-line
    *search({ payload }, { call, put }) {
      yield put({
        type: 'save',
        payload,
      });
    },

    // 保存图斑
    // eslint-disable-next-line
    *saveSpot({ payload, callback }, { call, put, select }) {
      const { flag } = payload;
      // 修改
      const result = yield call(updateSpot, { record: payload.record });
      const { success, message } = result;

      if (success) {
        // // 将图斑图片保存至数据库
        // const {
        //   spot: { imageInfos, selectedId },
        // } = yield select();
        // yield call(editAttachments, { records: imageInfos, RELATION_ID: selectedId });
        // 提示信息
        Toast.success('修改成功！', 1);
        if (!flag) {
          // 返回
          yield put({
            type: 'index/goBack',
          });
        }

        // 刷新列表
        yield put({
          type: 'refresh',
        });

        // // 刷新地图上的图斑
        // const records = yield call(querySpotByIdForMap, {
        //   id: payload.record.ID,
        // });
        // const [record] = records;
        // yield put({
        //   type: 'index/refreshMultipleSpots',
        //   payload: { records: [record] },
        // });

      }
      else {
        Toast.fail(message, 1);
      }
    },

    // 修改图斑图片
    // eslint-disable-next-line
    *updateImage({ payload, callback }, { call, put, select }) {
      // 将图斑图片保存至数据库
      const {
        spot: { imageInfos, selectedId },
      } = yield select();
      console.log('将图斑图片保存至数据库', imageInfos, selectedId);
      yield call(editAttachments, { records: imageInfos, RELATION_ID: selectedId });
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

    // 刷新关联新增的项目编号
    refreshProjectId(state, action) {
      return {
        ...state,
        PRID: action.payload.PRID,
      };
    },

    // 添加图片
    addImage(state, action) {
      return {
        ...state,
        imageInfos: [...state.imageInfos, action.payload.imageInfo],
      };
    },

    // 移除图片
    removeImage(state, action) {
      return {
        ...state,
        imageInfos: [
          ...state.imageInfos.slice(0, action.payload.index),
          ...state.imageInfos.slice(action.payload.index + 1),
        ],
      };
    },
  },
};
