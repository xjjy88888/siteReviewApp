import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { List, NavBar, Icon, Button } from 'antd-mobile';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';
import { FlowLayoutImagePicker } from '@/components/react-imagepicker';
import { createForm } from 'rc-form';
import NavContentContainer from '../../components/NavContentContainer';
import PanelContentContainer from '../../components/PanelContentContainer';

@connect(({ photoPoint, login }) => ({
  photoPoint,
  login,
}))
@createForm()
export default class PhotoPicture extends PureComponent {
  state = {
    photoIndex: 0,
    isOpen: false,
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
      photoPoint: { imageInfos },
    } = this.props;
    const { photoIndex, isOpen } = this.state;

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
                    readOnly
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
