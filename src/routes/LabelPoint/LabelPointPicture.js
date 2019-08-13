import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { List, NavBar, Icon, Modal, Toast } from 'antd-mobile';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';
import { FlowLayoutImagePicker } from '@/components/react-imagepicker';
import { createForm } from 'rc-form';
import NavContentContainer from '../../components/NavContentContainer';
import PanelContentContainer from '../../components/PanelContentContainer';
import { guid } from '../../utils/util';
import {
  ROOT_DIR_PATH,
  resolveLocalFileSystemURL,
  getDirectory,
  copyTo,
  getPicture,
  getPictureExif,
} from '../../utils/fileUtil';

@connect(({ labelPoint, login }) => ({
  labelPoint,
  login,
}))
@createForm()
export default class LabelPointPicture extends PureComponent {
  state = {
    photoIndex: 0,
    isOpen: false,
  };

  // 添加图片
  onAddImage = () => {
    Modal.operation([
      {
        text: '拍摄',
        onPress: () => {
          this.getPicture(true);
        },
      },
      {
        text: '从相册中选择',
        onPress: () => {
          this.getPicture(false);
        },
      },
    ]);
  };

  /* eslint-disable */
  getPicture = isCamera => {
    getPicture(isCamera).then(imageURI => this.onGetPicture(imageURI, isCamera));
  };
  /* eslint-enable */

  async onGetPicture(imageURI, isCamera) {
    const {
      dispatch,
      login: { user },
    } = this.props;

    const id = guid();
    // let fileEntry;
    const exif = await getPictureExif(imageURI);

    if (!exif.direction || !exif.Longitude || !exif.Latitude || !exif.originalTime) {
      Toast.info('请确保手机GPS获取信息的完整性！', 1);
    }

    // if (isCamera) {
    //   fileEntry = await resolveLocalFileSystemURL(imageURI);
    // } else {
    // 源文件
    const sourceFileEntry = await resolveLocalFileSystemURL(imageURI);

    // 复制文件
    const [rootDirPath, userDirName, parentDirName] = [ROOT_DIR_PATH, user.userName, 'labelPoint'];
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
    // }

    // 添加
    const imageInfo = {
      ID: id,
      RELATION_ID: this.selected.ID,
      TYPE: '水土流失风险照片截图',
      PATH: fileEntry.nativeURL,
      USER_ID: user.userId,
      USER_NAME: user.userName,
      SOURCE: 'labelPoint',
      AZIMUTH: exif.direction,
      LONGITUDE: exif.Longitude,
      LATITUDE: exif.Latitude,
      C_TIME: exif.originalTime,
    };
    dispatch({
      type: 'labelPoint/addImage',
      payload: {
        imageInfo,
      },
    });
  }

  // 删除图片
  onDeleteImage = index => {
    const { dispatch } = this.props;
    return new Promise(resolve => {
      Modal.alert('移除', '确定要移除此图片吗？', [
        {
          text: '取消',
          onPress: () => resolve(false),
        },
        {
          text: '确定',
          onPress: () => {
            dispatch({
              type: 'labelPoint/removeImage',
              payload: {
                index,
              },
            });
            resolve(true);
          },
        },
      ]);
    });
  };

  // 预览图片
  onPreviewImage = (value, values, i) => {
    this.setState({ photoIndex: i, isOpen: true });
  };

  // 获取图片地址
  getImageUrl = value => {
    return value.src;
  };

  render() {
    const {
      labelPoint: { selected, imageInfos },
    } = this.props;
    const { photoIndex, isOpen } = this.state;

    // 记录当前记录
    this.selected = selected;

    // 图片文件
    const images = imageInfos.map(record => {
      return {
        id: record.ID,
        src: record.PATH,
        arrow: record.AZIMUTH,
        x: record.LONGITUDE,
        y: record.LATITUDE,
        time: record.C_TIME,
      };
    });

    return (
      <div>
        <NavBar
          mode="dark"
          icon={<Icon type="left" />}
          onLeftClick={() =>
            this.props.dispatch({
              type: 'index/goBack',
            })
          }
        >
          照片
        </NavBar>
        <NavContentContainer>
          <PanelContentContainer>
            <List>
              <List.Item>
                <div style={{ maxWidth: 400, margin: 20 }}>
                  <FlowLayoutImagePicker
                    getImageUrl={this.getImageUrl}
                    onAddImage={this.onAddImage}
                    onDeleteImage={this.onDeleteImage}
                    onPreviewImage={this.onPreviewImage}
                    value={images}
                    readOnly={false}
                  />
                </div>
              </List.Item>
            </List>
          </PanelContentContainer>
        </NavContentContainer>
        {isOpen && (
          <Lightbox
            mainSrc={images[photoIndex].src}
            nextSrc={
              photoIndex === images.length - 1
                ? undefined
                : images[(photoIndex + 1) % images.length].src
            }
            prevSrc={
              photoIndex === 0
                ? undefined
                : images[(photoIndex + images.length - 1) % images.length].src
            }
            onCloseRequest={() => this.setState({ isOpen: false })}
            onMovePrevRequest={() =>
              this.setState({
                photoIndex: (photoIndex + images.length - 1) % images.length,
              })
            }
            onMoveNextRequest={() =>
              this.setState({
                photoIndex: (photoIndex + 1) % images.length,
              })
            }
            imageCaption={
              <div>
                经度：
                {images[photoIndex].x}
                &nbsp;&nbsp; 纬度：
                {images[photoIndex].y}
                <br />
                方位角：
                {images[photoIndex].arrow}
                &nbsp;&nbsp; 时间：
                {images[photoIndex].time}
              </div>
            }
          />
        )}
      </div>
    );
  }
}
