import { routerRedux } from 'dva/router';
import { Toast } from 'antd-mobile';
import {
  queryLabelPointById,
  addLabelPoint,
  updateLabelPoint,
  queryAttachmentsByRelationId,
  editAttachments,
  deleteLabelPointById,
  deleteAttachmentsByRelationId,
} from '../services/localApi';

// 初始状态
const initialState = {
  // 选择项
  selected: null,

  // 图片
  imageInfos: [],
};

export default {
  namespace: 'labelPoint',

  state: initialState,

  subscriptions: {
    // eslint-disable-next-line
    setup({ dispatch, history }) {},
  },

  effects: {
    // 显示编辑页面
    // eslint-disable-next-line
    *showEditPage({ payload }, { call, put }) {
      yield put({
        type: 'save',
        payload: payload,
      });
      yield put({
        type: 'queryRecordById',
        payload,
      });
      yield put(routerRedux.push('/main/index/labelPoint-edit'));
    },

    // 显示图斑照片页面
    // eslint-disable-next-line
    *showPicturePage({ payload }, { call, put }) {
      yield put(routerRedux.push('/main/index/labelPoint-picture'));
    },

    // 查询ID记录
    *queryRecordById({ payload }, { call, put }) {
      const { selectedId: id, SHAPE } = payload;

      let selected;
      let imageInfos;
      if (id) {
        // 选择项
        const selectedArr = yield call(queryLabelPointById, { id });
        [selected] = selectedArr;

        // 图片
        imageInfos = yield call(queryAttachmentsByRelationId, { id });
      } else {
        // 选择项
        selected = { SHAPE };

        // 图片
        imageInfos = [];
      }

      yield put({
        type: 'save',
        payload: {
          selected,
          imageInfos,
        },
      });
    },

    // 保存标注点
    // eslint-disable-next-line
    *saveLabelPoint({ payload, callback }, { call, put }) {
      const { isAdd, imageInfos, record } = payload;
      console.log('保存标注点', payload);
      if (isAdd) {
        // 新增
        const result = yield call(addLabelPoint, payload);
        const { success, message } = result;
        if (success) {
          // 将图片保存至数据库
          // const records = imageInfos.map(item => {
          //   return { ...item, RELATION_ID: record.ID };
          // });
          // yield call(editAttachments, { records });

          // 添加标注点至地图上
          yield put({
            type: 'index/addLabelPointToMap',
            payload: { record },
          });

          // 提示信息
          Toast.success('保存成功！', 1);

          // 返回
          yield put({
            type: 'index/goBack',
          });
        } else {
          Toast.fail(message, 1);
        }
      } else {
        // 修改
        const result = yield call(updateLabelPoint, payload);
        const { success, message } = result;
        if (success) {
          // 将图片保存至数据库
          // console.log('将图片保存至数据库imageInfos', imageInfos);
          // const records = imageInfos.map(item => {
          //   return { ...item, RELATION_ID: record.ID };
          // });
          // console.log('将图片保存至数据库records', records);
          // yield call(editAttachments, { records });

          // 提示信息
          Toast.success('修改成功！', 1);

          // 返回
          yield put({
            type: 'index/goBack',
          });
          
          // 刷新地图上的标注点
          yield put({
            type: 'index/refreshLabelPoints'
          });

        } else {
          Toast.fail(message, 1);
        }
      }
    },

    *updateImage({ payload, callback }, { call, put, select }) {
      // 将标注点图片保存至数据库
      const {
        labelPoint: { imageInfos, selectedId },
      } = yield select();
      console.log('将标注点图片保存至数据库', imageInfos, selectedId);
      yield call(editAttachments, { records: imageInfos, RELATION_ID: selectedId });
    },

    // 删除标注点
    // eslint-disable-next-line
    *deleteLabelPoint({ payload, callback }, { call, put }) {
      yield call(deleteLabelPointById, payload);
      yield call(deleteAttachmentsByRelationId, payload);
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
