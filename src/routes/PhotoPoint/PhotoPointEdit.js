import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { List, InputItem, NavBar, Icon, TextareaItem, Toast } from 'antd-mobile';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';
import { FlowLayoutImagePicker } from '@/components/react-imagepicker';
import TouchFeedback from 'rmc-feedback';
import { createForm } from 'rc-form';
import NavContentContainer from '../../components/NavContentContainer';
import PanelContentContainer from '../../components/PanelContentContainer';
import { guid } from '../../utils/util';

@connect(({ photoPoint, login }) => ({
  photoPoint,
  login,
}))
@createForm()
export default class PhotoPointEdit extends PureComponent {
  state = {
    photoIndex: 0,
    isOpen: false,
  };

  // 表单元素验证错误单击处理事件
  onErrorClick = name => {
    const { getFieldError } = this.props.form;
    const errors = getFieldError(name);
    // eslint-disable-next-line
    Toast.fail(errors.map((message, i) => <div key={i}>{message}</div>), 1);
  };

  // 预览图片
  onPreviewImage = (value, values, i) => {
    this.setState({ photoIndex: i, isOpen: true });
  };

  // 获取图片地址
  getImageUrl = value => {
    return value.src;
  };

  // 获取编辑后的记录
  getEditRecord = values => {
    return {
      ...values,
      OTIME: new Date().getTime(),
    };
  };

  handleSubmit = () => {
    const {
      login: { user },
      photoPoint: { imageInfos },
    } = this.props;
    this.props.form.validateFields((err, values) => {
      if (!err) {
        const editRecord = this.getEditRecord(values);
        let isAdd = false;
        let record;
        if (this.selected.ID == null) {
          // 新增
          isAdd = true;
          record = {
            ...editRecord,
            ID: guid(),
            SHAPE: this.selected.SHAPE,
            MDID: user.dwid,
            CPID: user.userId,
            CTIME: new Date().getTime(),
          };
        } else {
          // 修改
          record = {
            ...editRecord,
            ID: this.selected.ID,
            // eslint-disable-next-line
            _v: this.selected._v,
          };
        }

        console.log('保存', record);
        this.props.dispatch({
          type: 'photoPoint/savePhotoPoint',
          payload: {
            record,
            imageInfos,
            isAdd,
          },
        });
      }
    });
  };

  // 展示照片页面
  ShowPicture = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'photoPoint/showPicturePage',
    });
  };

  render() {
    const {
      photoPoint: { selected, imageInfos },
    } = this.props;

    const { getFieldProps, getFieldError } = this.props.form;
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
    if (!selected) return <div />;
    console.log('传入', selected);

    // 记录当前记录
    this.selected = selected;

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
          rightContent={[
            <TouchFeedback key="0" activeClassName="primary-feedback-active">
              <Icon type="check" style={{ marginRight: '16px' }} onClick={this.handleSubmit} />
            </TouchFeedback>,
          ]}
        >
          {selected.ID ? '照片点详情' : '新增照片点'}
        </NavBar>
        <NavContentContainer>
          <PanelContentContainer>
            <List>
              <InputItem
                labelNumber={20}
                {...getFieldProps('NAME', {
                  rules: [{ required: true, message: '名称不能为空！' }],
                  initialValue: selected.NAME,
                })}
                type="text"
                error={getFieldError('NAME')}
                onErrorClick={() => this.onErrorClick('NAME')}
              >
                名称
                <span className="global-form-star">*</span>：
              </InputItem>
              <InputItem
                {...getFieldProps('AZIMUTH', {
                  rules: [{ required: false }],
                  initialValue: selected.AZIMUTH,
                })}
                type="digit"
                labelNumber={20}
                editable={false}
              >
                方位角：
              </InputItem>
              <TextareaItem
                {...getFieldProps('PROBLEM', {
                  rules: [{ required: false }],
                  initialValue: selected.PROBLEM,
                })}
                title="问题："
                rows={3}
                count={1000}
              />
              <TextareaItem
                {...getFieldProps('PROPOSAL', {
                  rules: [{ required: false }],
                  initialValue: selected.PROPOSAL,
                })}
                title="建议："
                rows={3}
                count={1000}
              />
              <TextareaItem
                {...getFieldProps('MEMO', {
                  rules: [{ required: false }],
                  initialValue: selected.MEMO,
                })}
                title="备注："
                rows={3}
                count={1000}
              />
              {/* <List.Item arrow="horizontal" onClick={() => this.ShowPicture()}>
                照片
              </List.Item> */}
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
