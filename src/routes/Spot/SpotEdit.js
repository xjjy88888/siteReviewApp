import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import { Route } from 'dva/router';
import TouchFeedback from 'rmc-feedback';
import { List, TextareaItem, InputItem, NavBar, Icon, Modal, Toast, Button } from 'antd-mobile';
import DropdownTreeSelect from 'react-dropdown-tree-select';
import 'react-dropdown-tree-select/dist/styles.css';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';
import { FlowLayoutImagePicker } from '@/components/react-imagepicker';
import { createForm } from 'rc-form';
import NavContentContainer from '../../components/NavContentContainer';
import PanelContentContainer from '../../components/PanelContentContainer';
import { SearchPicker, DbSearchPicker } from '../../components/Picker';
import {
  queryDBProjectsByName,
  queryDBProjectById,
  getAllAdminArea,
} from '../../services/localApi';
import {
  ROOT_DIR_PATH,
  resolveLocalFileSystemURL,
  getDirectory,
  copyTo,
  getPicture,
  getPictureExif,
} from '../../utils/fileUtil';
import { guid, addChecked, toTreeData } from '../../utils/util';

// 参考：
// https://design.alipay.com/develop/web/components/form/
// https://github.com/fis-components/rc-form
// http://react-component.github.io/form/
// https://reactjs.org/docs/forms.html
// http://react-component.github.io/form/examples/redux.html
// 图斑编号：E-12-83

// 存储选择项
let nodes = ['flag'];

@connect(({ spot, login }) => ({
  spot,
  login,
}))
@createForm()
export default class SpotEdit extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      photoIndex: 0,
      isOpen: false,
      modal: false,
      areaData: this.props.spot.areaData,
      data: [],
    };
  }

  componentDidMount() {
    const {
      dispatch,
      spot: { selectedId },
    } = this.props;

    dispatch({
      type: 'spot/queryRecordById',
      payload: {
        selectedId,
      },
    });
  }

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
      spot: { selectedId },
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
    const [rootDirPath, userDirName, parentDirName] = [ROOT_DIR_PATH, user.userName, 'spot'];
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
      RELATION_ID: selectedId,
      TYPE: '水土流失风险照片截图',
      PATH: fileEntry.nativeURL,
      USER_ID: user.userId,
      USER_NAME: user.userName,
      SOURCE: 'spot',
      AZIMUTH: exif.direction,
      LONGITUDE: exif.Longitude,
      LATITUDE: exif.Latitude,
      C_TIME: exif.originalTime,
    };
    dispatch({
      type: 'spot/addImage',
      payload: {
        imageInfo,
      },
    });
    dispatch({
      type: 'spot/updateImage',
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
              type: 'spot/removeImage',
              payload: {
                index,
              },
            });
            dispatch({
              type: 'spot/updateImage',
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

  // 关闭对话框
  onClose = key => () => {
    this.setState({
      [key]: false,
    });
  };

  // tree插件
  onChange = (currentNode, selectedNodes) => {
    console.log('onChange::', currentNode, selectedNodes);

    if (selectedNodes.length > 0) {
      nodes = selectedNodes
        .map(item => {
          return item.value;
        })
        .join(',');
    } else {
      nodes = [];
    }
  };

  onAction = ({ action, node }) => {
    console.log(`onAction:: [${action}]`, node);
  };

  onNodeToggle = currentNode => {
    console.log('onNodeToggle::', currentNode);
  };

  // // 表单元素验证错误单击处理事件
  // onErrorClick = name => {
  //   const { getFieldError } = this.props.form;
  //   const errors = getFieldError(name);
  //   // eslint-disable-next-line
  //   Toast.fail(errors.map((message, i) => <div key={i}>{message}</div>), 1);
  // };

  // 新增项目
  onAddProject = e => {
    e.preventDefault();
    e.stopPropagation();

    this.props.dispatch({
      type: 'project/showEditPageFromSpot',
      payload: {
        selectedId: null,
      },
    });
  };

  // 获取Picker数据
  // 示例数据：
  // [
  //   [
  //     {
  //       label: '弃土（渣）场',
  //       value: '01',
  //     },
  //   ],
  // ]
  getPickerData = items => {
    if (!items) return [];

    const result = items.map(item => {
      return {
        label: item.DictValue,
        value: item.DictId,
      };
    });

    return [result];
  };

  // 将涉及县id串转化为name串
  getAreaTextValue = items => {
    const {
      spot: { adminArea },
    } = this.props;
    let areas = [];
    if (typeof items === 'string' && items.trim !== '') {
      areas = items.split(',');
    } else {
      areas = [];
    }

    if (areas.length > 0) {
      const name = [];
      areas.map(areaID => {
        const [areaName] = adminArea.filter(item => item.value === areaID);
        name.push(areaName.label);
        return name;
      });
      return name.join(',');
    } else {
      return null;
    }
  };

  // // 将涉及县name串转化为id串
  // getAreaTextLabel = items => {
  //   const {
  //     spot: { adminArea },
  //   } = this.props;
  //   if (typeof items === 'string' && items.trim !== '') {
  //     const ids = [];
  //     const names = items.split(',');
  //     names.map(name => {
  //       const [areaName] = adminArea.filter(item => item.label === name);
  //       ids.push(areaName.value);
  //       return ids;
  //     });
  //     return ids.join(',');
  //   } else {
  //     return null;
  //   }
  // };

  // 获取Picker枚举类型初始值
  getPickerInitialValue = (value, items) => {
    if (!items) return [];

    const [result] = items.filter(item => item.DictId === value);

    return result ? [result.DictId] : [];
  };

  // 获取编辑后的记录
  getEditRecord = (values, user) => {
    const PRID = this.getPickerValue(values.PRID);
    const bindInfo = {};
    if (PRID) {
      if (this.selected.BDID == null) {
        bindInfo.BPID = user.userId;
        bindInfo.BDID = user.dwid;
      }
    } else {
      bindInfo.BPID = null;
      bindInfo.BDID = null;
    }

    return {
      ID: this.selected.ID,
      QDNM: values.QDNM,
      PRID,
      QAREA: values.QAREA,
      EAREA: values.EAREA,
      QTYPE: this.getPickerValue(values.QTYPE),
      BYD: this.getPickerValue(values.BYD),
      QDTYPE: this.getPickerValue(values.QDTYPE),
      QDCS: this.getPickerValue(values.QDCS),
      SEROSION: this.getPickerValue(values.SEROSION),
      ISFOCUS: this.getPickerValue(values.ISFOCUS),
      ISREVIEW: this.getPickerValue(values.ISREVIEW),
      ADDRESS: values.ADDRESS,
      PROBLEM: values.PROBLEM,
      PROPOSAL: values.PROPOSAL,
      MEMO: values.MEMO,
      XZQDM: this.state.areaData,
      OTIME: new Date().getTime(),
      // eslint-disable-next-line
      _v: this.selected._v,
      ...bindInfo,
    };
  };

  // 获取选择项的值
  getPickerValue = value => {
    if (Array.isArray(value) && value.length > 0) {
      return value[0];
    }
  };

  // 是否类型
  yesOrNoTypes = [
    {
      DictValue: '是',
      DictId: '1',
    },
    {
      DictValue: '否',
      DictId: '0',
    },
  ];

  // 展示对话框，将数据赋值给tree插件
  showModal = key => e => {
    // 将选择项的值赋给复选框
    (async () => {
      // 获取所有行政区划
      const adminArea = await getAllAdminArea();

      // 遍历选择项新增checked属性
      const record = await addChecked(adminArea, this.state.areaData);

      // 封装成tree结构
      const node = toTreeData(record);

      this.setState({ data: node });
    })();

    e.preventDefault(); // 修复 Android 上点击穿透
    this.setState({
      [key]: true,
    });
  };

  // 展示照片页面
  ShowPicture = editable => {
    const { dispatch } = this.props;
    dispatch({
      type: 'spot/showPicturePage',
      payload: { editable },
    });
  };

  // 跳转同步页面。将图斑id传入model中
  imageSync = id => {
    this.props.dispatch({
      type: 'spot/showImageSyncPage',
      payload: { id },
    });
  };

  // 定位
  locateMap = () => {
    this.props.dispatch({
      type: 'spot/showMapPage',
    });
  };

  handleSubmit = () => {
    const {
      login: { user },
    } = this.props;

    this.props.form.validateFields((err, values) => {
      // if (this.state.areaData && values.QDNM) {
      if (values.QDNM) {
        // if (this.state.areaData.length > 0 && values.QDNM.length > 0) {
        if (values.QDNM.length > 0) {
          if (!err) {
            const record = this.getEditRecord(values, user);
            this.props.dispatch({
              type: 'spot/saveSpot',
              payload: {
                record,
              },
            });
          }
        } else {
          Toast.fail(
            <div>
              <span>带</span>
              <span className="global-form-star">*</span>
              <span>的标签内容不能为空！</span>
            </div>,
            1
          );
        }
      } else {
        Toast.fail(
          <div>
            <span>带</span>
            <span className="global-form-star">*</span>
            <span>的标签内容不能为空！</span>
          </div>,
          1
        );
      }
    });
  };

  submitTreeData = key => {
    // 如果没编辑保存，赋初始值
    if (nodes[0] === 'flag') {
      nodes = this.state.areaData;
    }

    this.setState({
      [key]: false,
      areaData: nodes,
    });
  };

  render() {
    const {
      routerData,
      match,
      spot: { imageInfos, selected, PRID, types },
      login: { user },
    } = this.props;
    const { photoIndex, isOpen } = this.state;
    const { getFieldProps, getFieldError } = this.props.form;

    if (!selected) return <div />;
    console.log('传入', selected);

    // 记录当前记录
    this.selected = selected;

    // 是否可编辑
    // const editable =
    //   selected.PRID == null ||
    //   (selected.PRID != null &&
    //     (selected.SUP_UNIT === user.dwid ||
    //       (selected.SUP_UNIT == null && selected.BDID === user.dwid)));
    const editable = true;

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

    const visibility = match.isExact ? 'visible' : 'hidden';
    return (
      <Fragment>
        <div style={{ visibility }}>
          <NavBar
            className="global-navbar"
            mode="dark"
            icon={
              <TouchFeedback activeClassName="primary-feedback-active">
                <Icon type="left" />
              </TouchFeedback>
            }
            onLeftClick={() =>
              this.props.dispatch({
                // type: 'spot/pictureBack',
                type: 'index/goBack',
              })
            }
            rightContent={
              editable
                ? [
                    // eslint-disable-next-line
                    <TouchFeedback key="1" activeClassName="primary-feedback-active">
                      <div
                        className="iconfont icon-map global-icon-normal"
                        style={{ marginRight: '16px' }}
                        onClick={this.locateMap}
                      />
                    </TouchFeedback>,

                    // eslint-disable-next-line
                    <TouchFeedback key="0" activeClassName="primary-feedback-active">
                      <Icon
                        type="check"
                        style={{ marginRight: '16px' }}
                        onClick={this.handleSubmit}
                      />
                    </TouchFeedback>,
                  ]
                : [
                    // eslint-disable-next-line
                    <TouchFeedback key="1" activeClassName="primary-feedback-active">
                      <div
                        className="iconfont icon-map global-icon-normal"
                        style={{ marginRight: '16px' }}
                        onClick={this.locateMap}
                      />
                    </TouchFeedback>,
                  ]
            }
          >
            {selected.ID ? '图斑详情' : '新增图斑'}
          </NavBar>
          <NavContentContainer>
            <PanelContentContainer>
              <List>
                <InputItem
                  {...getFieldProps('QDNM', {
                    rules: [{ required: true, message: '图斑编号不能为空！' }],
                    initialValue: selected.QDNM,
                  })}
                  type="text"
                  labelNumber={5}
                  editable={editable}
                  // error={getFieldError('QDNM')}
                  // onErrorClick={() => this.onErrorClick('QDNM')}
                >
                  图斑编号
                  <span className="global-form-star">*</span>：
                </InputItem>
                <InputItem
                  {...getFieldProps('QAREA', {
                    rules: [{ required: false }],
                    initialValue: selected.QAREA,
                  })}
                  type="digit"
                  editable={editable}
                  extra="ha"
                >
                  扰动面积：
                </InputItem>
                <SearchPicker
                  data={this.getPickerData(this.yesOrNoTypes)}
                  extra="请选择"
                  cascade={false}
                  {...getFieldProps('ISREVIEW', {
                    initialValue: this.getPickerInitialValue(selected.ISREVIEW, this.yesOrNoTypes),
                  })}
                  disabled={!editable}
                >
                  <List.Item arrow="horizontal">复核状态</List.Item>
                </SearchPicker>
                <SearchPicker
                  data={this.getPickerData(types.QTYPE)}
                  extra="请选择"
                  cascade={false}
                  {...getFieldProps('QTYPE', {
                    initialValue: this.getPickerInitialValue(selected.QTYPE, types.QTYPE),
                  })}
                  disabled={!editable}
                >
                  <List.Item arrow="horizontal">扰动类型</List.Item>
                </SearchPicker>
                <DbSearchPicker
                  extra="请选择"
                  cascade={false}
                  {...getFieldProps('PRID', {
                    initialValue: [PRID],
                  })}
                  idField="SWC_P_ID"
                  nameField="PRO_NAME"
                  queryById={queryDBProjectById}
                  queryByName={queryDBProjectsByName}
                  disabled={!editable}
                  value={[PRID]}
                  onChange={value => {
                    const [projectId] = value || [];
                    this.props.dispatch({
                      type: 'spot/refreshProjectId',
                      payload: {
                        PRID: projectId,
                      },
                    });
                  }}
                >
                  <List.Item arrow="horizontal">
                    关联项目&nbsp;
                    <TouchFeedback activeClassName="primary-feedback-active">
                      <span
                        className="iconfont icon-add global-icon-normal global-icon-selected"
                        onClick={this.onAddProject}
                      />
                    </TouchFeedback>
                  </List.Item>
                </DbSearchPicker>
                <InputItem
                  {...getFieldProps('EAREA', {
                    rules: [{ required: false }],
                    initialValue: selected.EAREA,
                  })}
                  type="digit"
                  labelNumber={7}
                  editable={editable}
                  extra="ha"
                >
                  扰动超出面积：
                </InputItem>
                {/* <InputItem
                  type="text"
                  labelNumber={20}
                  editable={false}
                  extra={editable ? <Icon type="right" onClick={this.showModal('modal')} /> : null}
                  // {...getFieldProps('XZQDM', {
                  // rules: [{ required: true, message: '涉及县（市、区）！' }],
                  // initialValue: this.getAreaTextValue(this.state.areaData),
                  // })}
                  value={this.getAreaTextValue(this.state.areaData)}
                >
                  涉及县（市、区）
                  <span className="global-form-star">*</span>：
                </InputItem> */}

                <Modal
                  visible={this.state.modal}
                  transparent
                  title="请选择"
                  footer={[
                    {
                      text: '取消',
                      onPress: () => {
                        console.log('cancle');
                        this.onClose('modal')();
                      },
                    },
                    {
                      text: '确定',
                      onPress: () => {
                        console.log('ok');
                        this.submitTreeData('modal');
                      },
                    },
                  ]}
                  wrapProps={{ onTouchStart: this.onWrapTouchStart }}
                >
                  <div
                    style={{
                      height: 430,
                      overflow: 'scroll',
                    }}
                  >
                    <DropdownTreeSelect
                      data={this.state.data}
                      onChange={this.onChange}
                      onAction={this.onAction}
                      onNodeToggle={this.onNodeToggle}
                      showDropdown
                      KeepTreeOnSearch
                      placeholderText="请输入关键字"
                      noMatchesText="无匹配结果"
                    />
                  </div>
                </Modal>
                <SearchPicker
                  data={this.getPickerData(types.BYD)}
                  extra="请选择"
                  cascade={false}
                  {...getFieldProps('BYD', {
                    initialValue: this.getPickerInitialValue(selected.BYD, types.BYD),
                  })}
                  disabled={!editable}
                >
                  <List.Item arrow="horizontal">扰动合规性</List.Item>
                </SearchPicker>
                <SearchPicker
                  data={this.getPickerData(types.QDTYPE)}
                  extra="请选择"
                  cascade={false}
                  {...getFieldProps('QDTYPE', {
                    initialValue: this.getPickerInitialValue(selected.QDTYPE, types.QDTYPE),
                  })}
                  disabled={!editable}
                >
                  <List.Item arrow="horizontal">扰动变化类型</List.Item>
                </SearchPicker>
                <SearchPicker
                  data={this.getPickerData(types.QDCS)}
                  extra="请选择"
                  cascade={false}
                  {...getFieldProps('QDCS', {
                    initialValue: this.getPickerInitialValue(selected.QDCS, types.QDCS),
                  })}
                  disabled={!editable}
                >
                  <List.Item arrow="horizontal">建设状态</List.Item>
                </SearchPicker>
                {/* <SearchPicker
                  data={this.getPickerData(types.SEROSION)}
                  extra="请选择"
                  cascade={false}
                  {...getFieldProps('SEROSION', {
                    initialValue: this.getPickerInitialValue(selected.SEROSION, types.SEROSION),
                  })}
                  disabled={!editable}
                >
                  <List.Item arrow="horizontal">土壤侵蚀强度</List.Item>
                </SearchPicker> */}
                {/* <SearchPicker
                  data={this.getPickerData(this.yesOrNoTypes)}
                  extra="请选择"
                  cascade={false}
                  {...getFieldProps('ISFOCUS', {
                    initialValue: this.getPickerInitialValue(selected.ISFOCUS, this.yesOrNoTypes),
                  })}
                  disabled={!editable}
                >
                  <List.Item arrow="horizontal">是否重点监管</List.Item>
                </SearchPicker> */}
                <TextareaItem
                  {...getFieldProps('ADDRESS', {
                    rules: [{ required: false }],
                    initialValue: selected.ADDRESS,
                  })}
                  title="详细地址："
                  rows={2}
                  count={100}
                  editable={editable}
                />
                <TextareaItem
                  {...getFieldProps('PROBLEM', {
                    rules: [{ required: false }],
                    initialValue: selected.PROBLEM,
                  })}
                  title="问题："
                  rows={3}
                  count={1000}
                  editable={editable}
                />
                <TextareaItem
                  {...getFieldProps('PROPOSAL', {
                    rules: [{ required: false }],
                    initialValue: selected.PROPOSAL,
                  })}
                  title="建议："
                  rows={3}
                  count={1000}
                  editable={editable}
                />
                <TextareaItem
                  {...getFieldProps('MEMO', {
                    rules: [{ required: false }],
                    initialValue: selected.MEMO,
                  })}
                  title="备注："
                  rows={3}
                  count={1000}
                  editable={editable}
                />
                {/* <List.Item arrow="horizontal" onClick={() => this.ShowPicture(editable)}>
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
                      readOnly={!editable}
                    />
                  </div>
                </List.Item>
                {editable ? (
                  <Button type="primary" onClick={() => this.imageSync(selected.ID)}>
                    照片同步
                  </Button>
                ) : null}
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
        <Route
          path={`${match.url}/project-edit`}
          component={routerData[`/main/index/project-edit`].component}
        />
      </Fragment>
    );
  }
}
