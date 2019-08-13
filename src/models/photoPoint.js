import { routerRedux } from 'dva/router';
import { Toast } from 'antd-mobile';
import {
  queryPhotoPointById,
  addPhotoPoint,
  updatePhotoPoint,
  queryAttachmentsByRelationId,
  editAttachments,
  deletePhotoPointById,
  deleteAttachmentsByRelationId,
} from '../services/localApi';
import { guid } from '../utils/util';
import { ROOT_DIR_PATH, resolveLocalFileSystemURL, getDirectory, copyTo } from '../utils/fileUtil';

// 获取图片信息
async function getImageInfo(imageURI, user, AZIMUTH, LONGITUDE, LATITUDE, C_TIME) {
  const id = guid();
  // 源文件
  const sourceFileEntry = await resolveLocalFileSystemURL(imageURI);

  // 复制文件
  const [rootDirPath, userDirName, parentDirName] = [ROOT_DIR_PATH, user.userName, 'photoPoint'];
  const rootDirEntry = await resolveLocalFileSystemURL(rootDirPath);
  const userDirEntry = await getDirectory(rootDirEntry, userDirName);
  const parentDirEntry = await getDirectory(userDirEntry, parentDirName);

  // 文件扩展名
  let extension = '.jpg';
  const type = await new Promise(resolve => sourceFileEntry.file(file => resolve(file.type)));
  switch (type.toLowerCase()) {
    case 'image/jpeg':
      extension = '.jpg';
      break;
    case 'image/png':
      extension = '.png';
      break;
    default:
      break;
  }
  const fileName = id + extension;
  const destFileEntry = await copyTo(sourceFileEntry, parentDirEntry, fileName);
  const fileEntry = destFileEntry;

  // 添加
  const imageInfo = {
    ID: id,
    TYPE: '水土流失风险照片截图',
    PATH: fileEntry.nativeURL,
    USER_ID: user.userId,
    USER_NAME: user.userName,
    SOURCE: 'photoPoint',
    AZIMUTH,
    LONGITUDE,
    LATITUDE,
    C_TIME,
  };

  return imageInfo;
}

// 初始状态
const initialState = {
  // 选择项
  selected: null,

  // 图片
  imageInfos: [],
};

export default {
  namespace: 'photoPoint',

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
        type: 'queryRecordById',
        payload,
      });
      yield put(routerRedux.push('/main/index/photoPoint-edit'));
    },

    // 显示图斑照片页面
    // eslint-disable-next-line
    *showPicturePage({ payload }, { call, put }) {
      yield put(routerRedux.push('/main/index/photoPoint-picture'));
    },

    // 查询ID记录
    *queryRecordById({ payload }, { call, put, select }) {
      const {
        login: { user },
      } = yield select();
      const { selectedId: id, imageURI, AZIMUTH, SHAPE, LONGITUDE, LATITUDE, C_TIME } = payload;

      let selected;
      let imageInfos;
      if (id) {
        // 选择项
        const selectedArr = yield call(queryPhotoPointById, { id });
        [selected] = selectedArr;

        // 图片
        imageInfos = yield call(queryAttachmentsByRelationId, { id });
      } else {
        // 选择项
        selected = { AZIMUTH, SHAPE };

        // 图片
        imageInfos = [
          yield call(getImageInfo, imageURI, user, AZIMUTH, LONGITUDE, LATITUDE, C_TIME),
        ];
      }

      yield put({
        type: 'save',
        payload: {
          selected,
          imageInfos,
        },
      });
    },

    // 保存照片点
    // eslint-disable-next-line
    *savePhotoPoint({ payload, callback }, { call, put }) {
      const { isAdd, imageInfos, record } = payload;
      if (isAdd) {
        // 新增
        const result = yield call(addPhotoPoint, payload);
        const { success, message } = result;
        if (success) {
          // 将图片保存至数据库
          const records = imageInfos.map(item => {
            return { ...item, RELATION_ID: record.ID };
          });
          yield call(editAttachments, { records });

          // 添加照片点至地图上
          yield put({
            type: 'index/addPhotoPointToMap',
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
        const result = yield call(updatePhotoPoint, payload);
        const { success, message } = result;
        if (success) {
          // 提示信息
          Toast.success('修改成功！', 1);

          // 返回
          yield put({
            type: 'index/goBack',
          });
        } else {
          Toast.fail(message, 1);
        }
      }
    },

    // 删除照片点
    // eslint-disable-next-line
    *deletePhotoPoint({ payload, callback }, { call, put }) {
      yield call(deletePhotoPointById, payload);
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
  },
};
