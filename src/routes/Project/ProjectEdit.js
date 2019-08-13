import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { List, DatePicker, TextareaItem, InputItem, NavBar, Icon, Modal, Toast } from 'antd-mobile';
import { createForm } from 'rc-form';
import DropdownTreeSelect from 'react-dropdown-tree-select';
import 'react-dropdown-tree-select/dist/styles.css';
import TouchFeedback from 'rmc-feedback';
import NavContentContainer from '../../components/NavContentContainer';
import PanelContentContainer from '../../components/PanelContentContainer';
import { SearchPicker, DbSearchPicker } from '../../components/Picker';
import {
  queryDBCsUnitsByName,
  queryDBCsUnitById,
  queryDBDepts,
  queryDBDeptById,
  getAllAdminArea,
} from '../../services/localApi';
import { guid, addChecked, toTreeData } from '../../utils/util';

// 存储选择项
let nodes = ['flag'];

@connect(({ project, login }) => ({
  project,
  login,
}))
@createForm()
export default class ProjectEdit extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      modal: false,
      areaData: this.props.project.areaData,
      data: [],
    };
  }

  componentDidMount() {
    const {
      dispatch,
      project: { selectedId },
    } = this.props;

    dispatch({
      type: 'project/queryRecordById',
      payload: {
        selectedId,
      },
    });
  }

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

  // 表单元素验证错误单击处理事件
  onErrorClick = name => {
    const { getFieldError } = this.props.form;
    const errors = getFieldError(name);
    // eslint-disable-next-line
    Toast.fail(errors.map((message, i) => <div key={i}>{message}</div>), 1);
  };

  // 新增建设单位
  onAddCsUnits = e => {
    e.preventDefault();
    e.stopPropagation();

    const {
      dispatch,
      login: { user },
    } = this.props;

    Modal.prompt(
      '新增建设单位',
      '',
      [
        {
          text: '取消',
        },
        {
          text: '确定',
          onPress: value =>
            new Promise(resolve => {
              if (value.trim() === '') {
                Toast.fail('建设单位名称不能为空！', 1);
              } else if (value.length > 50) {
                Toast.fail('建设单位名称长度不能超过50！', 1);
              } else {
                const record = {
                  ID: guid(),
                  DP_NAME: value.trim(),
                  C_PERSON: user.userId,
                  C_TIME: new Date().getTime(),
                };

                dispatch({
                  type: 'csUnit/saveAddCsUnit',
                  payload: { record },
                  callback: result => {
                    const { success, message } = result;
                    if (success) {
                      this.props.form.setFieldsValue({
                        CS_UNIT_ID: [record.ID],
                      });
                      resolve();
                    } else {
                      Toast.fail(message, 1);
                    }
                  },
                });
              }
            }),
        },
      ],
      'default',
      null,
      ['请输入建设单位名称']
    );
  };

  // 将涉及县id串转化为name串
  getAreaTextValue = items => {
    const {
      project: { adminArea },
    } = this.props;
    // console.log('adminArea', adminArea, items);
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
  //     project: { adminArea },
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

  // 获取Picker数据
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

  // 获取Picker枚举类型初始值
  getPickerInitialValue = (value, items) => {
    if (!items) return [];

    const [result] = items.filter(item => item.DictId === value);

    return result ? [result.DictId] : [];
  };

  // 获取DatePicker枚举类型初始值
  getDatePickerInitialValue = value => {
    if (!value) return null;

    return new Date(value);
  };

  // 获取编辑后的记录
  getEditRecord = values => {
    return {
      PRO_NAME: values.PRO_NAME,
      CS_UNIT_ID: this.getPickerValue(values.CS_UNIT_ID),
      SUP_UNIT: this.getPickerValue(values.SUP_UNIT),
      PRO_LEVEL: this.getPickerValue(values.PRO_LEVEL),
      RP_AGNT_ID: this.getPickerValue(values.RP_AGNT_ID),
      IVV_CNTY: this.state.areaData,
      RP_NUM: values.RP_NUM,
      RP_TIME: values.RP_TIME ? values.RP_TIME.getTime() : null,
      PRO_TYPE: this.getPickerValue(values.PRO_TYPE),
      PRO_CATE: this.getPickerValue(values.PRO_CATE),
      PRO_NAT: this.getPickerValue(values.PRO_NAT),
      CST_STATE: this.getPickerValue(values.CST_STATE),
      XMHGX: this.getPickerValue(values.XMHGX),
      VEC_TYPE: this.getPickerValue(values.VEC_TYPE),
      MEMO: values.MEMO,
    };
  };

  // 获取选择项的值
  getPickerValue = value => {
    if (Array.isArray(value) && value.length > 0) {
      return value[0];
    }
  };

  relatedSpots = () => {
    this.props.dispatch({
      type: 'project/showRelationSpots',
    });
  };

  // 展示对话框，将数据赋值给tree插件
  showModal = key => e => {
    // 将选择项的值赋给复选框
    (async () => {
      // 获取所有行政区划
      const adminArea = await getAllAdminArea();

      // 遍历选择项新增checked属性
      const record = await addChecked(adminArea, this.state.areaData);
      // console.log('获取所有行政区划', record);

      // 封装成tree结构
      const node = toTreeData(record);

      this.setState({ data: node });
    })();

    e.preventDefault(); // 修复 Android 上点击穿透
    this.setState({
      [key]: true,
    });
  };

  // 定位
  locateMap = () => {
    this.props.dispatch({
      type: 'project/showMapPage',
    });
  };

  handleSubmit = () => {
    const {
      login: { user },
    } = this.props;

    this.props.form.validateFields((err, values) => {
      if (this.state.areaData && values.PRO_NAME) {
        if (this.state.areaData.length > 0 && values.PRO_NAME.length > 0) {
          if (!err) {
            const editRecord = this.getEditRecord(values);
            let isAdd = false;
            let record;
            if (this.selected.SWC_P_ID == null) {
              // 新增
              isAdd = true;
              record = {
                ...editRecord,
                SWC_P_ID: guid(),
                C_PERSON: user.userId,
                C_TIME: new Date().getTime(),
              };
            } else {
              // 修改
              record = {
                ...editRecord,
                SWC_P_ID: this.selected.SWC_P_ID,
                M_PERSON: user.userId,
                M_TIME: new Date().getTime(),
                // eslint-disable-next-line
                _v: this.selected._v,
              };
            }

            console.log('保存', record);
            this.props.dispatch({
              type: 'project/saveProject',
              payload: {
                record,
                isAdd,
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
      project: { selected, types, spotsArry },
      login: { user },
    } = this.props;
    const { getFieldProps, getFieldError } = this.props.form;
    const { Item } = List;
    if (!selected) return <div />;
    console.log('传入', selected, this.props);

    // 记录当前记录
    this.selected = selected;

    // 是否可编辑
    // const editable =
    //   selected.SUP_UNIT === user.dwid || selected.SUP_UNIT == null || selected.SWC_P_ID == null;
    const editable = true;

    return (
      <div>
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
                  <TouchFeedback activeClassName="primary-feedback-active" key="0">
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
          {selected.SWC_P_ID ? '项目详情' : '新增项目'}
        </NavBar>
        <NavContentContainer>
          <PanelContentContainer>
            <List>
              <InputItem
                {...getFieldProps('PRO_NAME', {
                  rules: [{ required: true, message: '项目名称不能为空！' }],
                  initialValue: selected.PRO_NAME,
                })}
                type="text"
                labelNumber={5}
                editable={editable}
                maxLength={50}
                // error={getFieldError('PRO_NAME')}
                // onErrorClick={() => this.onErrorClick('PRO_NAME')}
              >
                项目名称
                <span className="global-form-star">*</span>：
              </InputItem>
              <Item arrow="horizontal" onClick={() => this.relatedSpots()}>
                图斑个数：
                {spotsArry.length}
              </Item>
              <DbSearchPicker
                extra="请选择"
                cascade={false}
                {...getFieldProps('CS_UNIT_ID', {
                  initialValue: [selected.CS_UNIT_ID],
                })}
                idField="ID"
                nameField="DP_NAME"
                queryById={queryDBCsUnitById}
                queryByName={queryDBCsUnitsByName}
                disabled={!editable}
              >
                <List.Item arrow="horizontal">
                  建设单位&nbsp;
                  <TouchFeedback activeClassName="primary-feedback-active">
                    <span
                      className="iconfont icon-add global-icon-normal global-icon-selected"
                      onClick={this.onAddCsUnits}
                    />
                  </TouchFeedback>
                </List.Item>
              </DbSearchPicker>
              <DbSearchPicker
                extra="请选择"
                cascade={false}
                {...getFieldProps('SUP_UNIT', {
                  initialValue: [selected.SUP_UNIT],
                })}
                idField="DP_ID"
                nameField="newName"
                queryById={queryDBDeptById}
                queryByName={queryDBDepts}
                disabled={!editable}
              >
                <List.Item arrow="horizontal">监管单位</List.Item>
              </DbSearchPicker>
              <SearchPicker
                data={this.getPickerData(types.PRO_LEVEL)}
                extra="请选择"
                cascade={false}
                {...getFieldProps('PRO_LEVEL', {
                  initialValue: this.getPickerInitialValue(selected.PRO_LEVEL, types.PRO_LEVEL),
                })}
                disabled={!editable}
              >
                <List.Item arrow="horizontal">立项级别</List.Item>
              </SearchPicker>
              <DbSearchPicker
                extra="请选择"
                cascade={false}
                {...getFieldProps('RP_AGNT_ID', {
                  initialValue: [selected.RP_AGNT_ID],
                })}
                idField="DP_ID"
                nameField="newName"
                queryById={queryDBDeptById}
                queryByName={queryDBDepts}
                disabled={!editable}
              >
                <List.Item arrow="horizontal">批复机构</List.Item>
              </DbSearchPicker>
              <InputItem
                type="text"
                labelNumber={20}
                editable={false}
                extra={editable ? <Icon type="right" onClick={this.showModal('modal')} /> : null}
                // {...getFieldProps('IVV_CNTY', {
                // rules: [{ required: false }],
                // initialValue: this.getAreaTextValue(this.state.areaData),
                // })}
                value={this.getAreaTextValue(this.state.areaData)}
              >
                涉及县（市、区）
                <span className="global-form-star">*</span>：
              </InputItem>
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
              <InputItem
                {...getFieldProps('RP_NUM', {
                  rules: [{ required: false }],
                  initialValue: selected.RP_NUM,
                })}
                type="text"
                editable={editable}
                maxLength={50}
              >
                批复文号：
              </InputItem>
              <DatePicker
                mode="date"
                extra="请选择"
                {...getFieldProps('RP_TIME', {
                  initialValue: this.getDatePickerInitialValue(selected.RP_TIME),
                })}
                disabled={!editable}
              >
                <List.Item arrow="horizontal">批复时间</List.Item>
              </DatePicker>
              <SearchPicker
                data={this.getPickerData(types.PRO_TYPE)}
                extra="请选择"
                cascade={false}
                {...getFieldProps('PRO_TYPE', {
                  initialValue: this.getPickerInitialValue(selected.PRO_TYPE, types.PRO_TYPE),
                })}
                disabled={!editable}
              >
                <List.Item arrow="horizontal">项目类型</List.Item>
              </SearchPicker>
              <SearchPicker
                data={this.getPickerData(types.PRO_CATE)}
                extra="请选择"
                cascade={false}
                {...getFieldProps('PRO_CATE', {
                  initialValue: this.getPickerInitialValue(selected.PRO_CATE, types.PRO_CATE),
                })}
                disabled={!editable}
              >
                <List.Item arrow="horizontal">项目类别</List.Item>
              </SearchPicker>
              <SearchPicker
                data={this.getPickerData(types.PRO_NAT)}
                extra="请选择"
                cascade={false}
                {...getFieldProps('PRO_NAT', {
                  initialValue: this.getPickerInitialValue(selected.PRO_NAT, types.PRO_NAT),
                })}
                disabled={!editable}
              >
                <List.Item arrow="horizontal">项目性质</List.Item>
              </SearchPicker>
              <SearchPicker
                data={this.getPickerData(types.CST_STATE)}
                extra="请选择"
                cascade={false}
                {...getFieldProps('CST_STATE', {
                  initialValue: this.getPickerInitialValue(selected.CST_STATE, types.CST_STATE),
                })}
                disabled={!editable}
              >
                <List.Item arrow="horizontal">建设状态</List.Item>
              </SearchPicker>
              <SearchPicker
                data={this.getPickerData(types.XMHGX)}
                extra="请选择"
                cascade={false}
                {...getFieldProps('XMHGX', {
                  initialValue: this.getPickerInitialValue(selected.XMHGX, types.XMHGX),
                })}
                disabled={!editable}
              >
                <List.Item arrow="horizontal">项目合规性</List.Item>
              </SearchPicker>
              <SearchPicker
                data={this.getPickerData(types.VEC_TYPE)}
                extra="请选择"
                cascade={false}
                {...getFieldProps('VEC_TYPE', {
                  initialValue: this.getPickerInitialValue(selected.VEC_TYPE, types.VEC_TYPE),
                })}
                disabled={!editable}
              >
                <List.Item arrow="horizontal">矢量化类型</List.Item>
              </SearchPicker>
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
            </List>
          </PanelContentContainer>
        </NavContentContainer>
      </div>
    );
  }
}
