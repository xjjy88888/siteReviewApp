import {
  querySpotIds,
  queryLabelPointIds,
  // queryPhotoPointIds,
  queryAttachmentsCount,
  queryAttachmentsModifyCounts,
} from '../services/localApi';
import { queryAttachments } from '../services/httpApi';

// 获取在线数量
function* queryOnlineCounts({ call }) {
  // 在线图斑图片数量
  const onlineSpotImagesCount = yield call(queryOnlineAttachmentsCount, {
    ids: yield call(querySpotIds),
    soucre: 'spot',
  });

  // 在线标注点图片数量
  const onlineLabelPointImagesCount = yield call(queryOnlineAttachmentsCount, {
    ids: yield call(queryLabelPointIds),
    soucre: 'labelPoint',
  });

  // 在线照片点图片数量
  // const onlinePhotoPointImagesCount = yield call(
  //   queryOnlineAttachmentsCount,
  //   yield call(queryPhotoPointIds)
  // );

  return {
    onlineSpotImagesCount,
    onlineLabelPointImagesCount,
    // onlinePhotoPointImagesCount,
  };
}

// 根据关联id查询在线附件数量
async function queryOnlineAttachmentsCount(payload) {
  const { ids, soucre } = payload;
  const uniqueIds = [...new Set(ids.map(item => item.ID))]; // id去重
  const { data: items } = await queryAttachments({ id: uniqueIds.join(','), soucre: soucre });
  let count = 0;
  for (const key in items) {
    if ({}.hasOwnProperty.call(items, key)) {
      count += items[key].length;
    }
  }

  return count;
}

// 获取本地数量
function* queryLocalCounts({ call }) {
  // 图斑图片
  const localSpotImagesCount = yield call(queryAttachmentsCount, { where: `SOURCE='spot'` });
  const {
    addAttachmentsCount: addSpotImagesCount,
    updateAttachmentsCount: updateSpotImagesCount,
    deleteAttachmentsCount: deleteSpotImagesCount,
  } = yield call(queryAttachmentsModifyCounts, { where: `SOURCE='spot'` });

  // 标注点图片
  const localLabelPointImagesCount = yield call(queryAttachmentsCount, {
    where: `SOURCE='labelPoint'`,
  });
  const {
    addAttachmentsCount: addLabelPointImagesCount,
    updateAttachmentsCount: updateLabelPointImagesCount,
    deleteAttachmentsCount: deleteLabelPointImagesCount,
  } = yield call(queryAttachmentsModifyCounts, { where: `SOURCE='labelPoint'` });

  // 照片点图片
  // const localPhotoPointImagesCount = yield call(queryAttachmentsCount, {
  //   where: `SOURCE='photoPoint'`,
  // });
  // const {
  //   addAttachmentsCount: addPhotoPointImagesCount,
  //   updateAttachmentsCount: updatePhotoPointImagesCount,
  //   deleteAttachmentsCount: deletePhotoPointImagesCount,
  // } = yield call(queryAttachmentsModifyCounts, { where: `SOURCE='photoPoint'` });

  return {
    localSpotImagesCount,
    addSpotImagesCount,
    updateSpotImagesCount,
    deleteSpotImagesCount,
    localLabelPointImagesCount,
    addLabelPointImagesCount,
    updateLabelPointImagesCount,
    deleteLabelPointImagesCount,
    // localPhotoPointImagesCount,
    // addPhotoPointImagesCount,
    // updatePhotoPointImagesCount,
    // deletePhotoPointImagesCount,
  };
}

// 初始状态
const initialState = {
  // 图斑图片
  onlineSpotImagesCount: 0,
  localSpotImagesCount: 0,
  addSpotImagesCount: 0,
  updateSpotImagesCount: 0,
  deleteSpotImagesCount: 0,

  // 标注点图片
  onlineLabelPointImagesCount: 0,
  localLabelPointImagesCount: 0,
  addLabelPointImagesCount: 0,
  updateLabelPointImagesCount: 0,
  deleteLabelPointImagesCount: 0,

  // 照片点图片
  // onlinePhotoPointImagesCount: 0,
  // localPhotoPointImagesCount: 0,
  // addPhotoPointImagesCount: 0,
  // updatePhotoPointImagesCount: 0,
  // deletePhotoPointImagesCount: 0,
};

export default {
  namespace: 'attachmentSync',

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
