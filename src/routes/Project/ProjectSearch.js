import React, { PureComponent } from 'react';
import { connect } from 'dva';
import TouchFeedback from 'rmc-feedback';
import { List, InputItem, NavBar, DatePicker, Icon, Flex } from 'antd-mobile';
import { createForm } from 'rc-form';
import NavContentContainer from '../../components/NavContentContainer';
import PanelContentContainer from '../../components/PanelContentContainer';
import { SearchPicker, DbSearchPicker } from '../../components/Picker';
import {
  queryDBCsUnitsByName,
  queryDBCsUnitById,
  queryDBDepts,
  queryDBDeptById,
} from '../../services/localApi';
import styles from './ProjectSearch.less';

// 参考：
// https://design.alipay.com/develop/web/components/form/
// https://github.com/fis-components/rc-form
// http://react-component.github.io/form/
// https://reactjs.org/docs/forms.html
@connect(({ project }) => ({
  project,
}))
@createForm()
export default class ProjectSearch extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;

    dispatch({
      type: 'project/queryTypes',
    });
  }

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

  // 获取where条件
  getWhere = values => {
    const result = [];

    if (values.PRO_NAME) result.push(`PRO_NAME like '%${values.PRO_NAME}%'`);

    if (values.RP_TIMEmin) result.push(`RP_TIME >= ${values.RP_TIMEmin.getTime()}`);

    if (values.RP_TIMEmax) result.push(`RP_TIME <= ${values.RP_TIMEmax.getTime()}`);

    if (values.RP_NUM) result.push(`RP_NUM like '%${values.RP_NUM}%'`);

    let condition = this.getPickerWhere('CS_UNIT_ID', values.CS_UNIT_ID);
    if (condition) result.push(condition);

    condition = this.getPickerWhere('SUP_UNIT', values.SUP_UNIT);
    if (condition) result.push(condition);

    condition = this.getPickerWhere('PRO_LEVEL', values.PRO_LEVEL);
    if (condition) result.push(condition);

    condition = this.getPickerWhere('RP_AGNT_ID', values.RP_AGNT_ID);
    if (condition) result.push(condition);

    condition = this.getPickerWhere('PRO_TYPE', values.PRO_TYPE);
    if (condition) result.push(condition);

    condition = this.getPickerWhere('PRO_CATE', values.PRO_CATE);
    if (condition) result.push(condition);

    condition = this.getPickerWhere('PRO_NAT', values.PRO_NAT);
    if (condition) result.push(condition);

    condition = this.getPickerWhere('CST_STATE', values.CST_STATE);
    if (condition) result.push(condition);

    condition = this.getPickerWhere('XMHGX', values.XMHGX);
    if (condition) result.push(condition);

    condition = this.getPickerWhere('VEC_TYPE', values.VEC_TYPE);
    if (condition) result.push(condition);

    return result.join(' and ');
  };

  // 获取选择项的where条件
  getPickerWhere = (key, value) => {
    if (Array.isArray(value) && value.length > 0) {
      return `${key} = '${value[0]}'`;
    }
  };

  handleSubmit = () => {
    this.props.form.validateFields((err, values) => {
      if (!err) {
        const where = this.getWhere(values);
        this.props.dispatch({
          type: 'project/search',
          payload: {
            where,
          },
        });

        this.props.dispatch({
          type: 'index/goBack',
        });
      }
    });
  };

  render() {
    const {
      project: { types },
    } = this.props;
    const { getFieldProps } = this.props.form;
    if (!types) return <div />;

    return (
      <div>
        <NavBar
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
          rightContent={[
            <TouchFeedback activeClassName="primary-feedback-active" key="0">
              <Icon type="check" style={{ marginRight: '16px' }} onClick={this.handleSubmit} />
            </TouchFeedback>,
          ]}
        >
          项目查询
        </NavBar>
        <NavContentContainer>
          <PanelContentContainer>
            <List>
              <InputItem {...getFieldProps('PRO_NAME', {})} type="text">
                项目名称：
              </InputItem>
              <DbSearchPicker
                extra="请选择"
                cascade={false}
                {...getFieldProps('CS_UNIT_ID', {})}
                idField="ID"
                nameField="DP_NAME"
                queryById={queryDBCsUnitById}
                queryByName={queryDBCsUnitsByName}
              >
                <List.Item arrow="horizontal">建设单位</List.Item>
              </DbSearchPicker>
              <DbSearchPicker
                extra="请选择"
                cascade={false}
                {...getFieldProps('SUP_UNIT', {})}
                idField="DP_ID"
                nameField="newName"
                queryById={queryDBDeptById}
                queryByName={queryDBDepts}
              >
                <List.Item arrow="horizontal">监管单位</List.Item>
              </DbSearchPicker>
              <SearchPicker
                data={this.getPickerData(types.PRO_LEVEL)}
                extra="请选择"
                cascade={false}
                {...getFieldProps('PRO_LEVEL', {})}
              >
                <List.Item arrow="horizontal">立项级别</List.Item>
              </SearchPicker>
              <DbSearchPicker
                extra="请选择"
                cascade={false}
                {...getFieldProps('RP_AGNT_ID', {})}
                idField="DP_ID"
                nameField="newName"
                queryById={queryDBDeptById}
                queryByName={queryDBDepts}
              >
                <List.Item arrow="horizontal">批复机构</List.Item>
              </DbSearchPicker>

              <InputItem {...getFieldProps('RP_NUM', {})} type="text">
                批复文号：
              </InputItem>
              <Flex>
                <Flex.Item>
                  <DatePicker mode="date" extra="请选择" {...getFieldProps('RP_TIMEmin', {})}>
                    <List.Item arrow="horizontal">批复时间</List.Item>
                  </DatePicker>
                </Flex.Item>
                <Flex.Item prefixCls={`${styles.item} am-flexbox`}>
                  <DatePicker mode="date" extra="请选择" {...getFieldProps('RP_TIMEmax', {})}>
                    <List.Item arrow="horizontal">至</List.Item>
                  </DatePicker>
                </Flex.Item>
              </Flex>
              <SearchPicker
                data={this.getPickerData(types.PRO_TYPE)}
                extra="请选择"
                cascade={false}
                {...getFieldProps('PRO_TYPE', {})}
              >
                <List.Item arrow="horizontal">项目类型</List.Item>
              </SearchPicker>
              <SearchPicker
                data={this.getPickerData(types.PRO_CATE)}
                extra="请选择"
                cascade={false}
                {...getFieldProps('PRO_CATE', {})}
              >
                <List.Item arrow="horizontal">项目类别</List.Item>
              </SearchPicker>
              <SearchPicker
                data={this.getPickerData(types.PRO_NAT)}
                extra="请选择"
                cascade={false}
                {...getFieldProps('PRO_NAT', {})}
              >
                <List.Item arrow="horizontal">项目性质</List.Item>
              </SearchPicker>
              <SearchPicker
                data={this.getPickerData(types.CST_STATE)}
                extra="请选择"
                cascade={false}
                {...getFieldProps('CST_STATE', {})}
              >
                <List.Item arrow="horizontal">建设状态</List.Item>
              </SearchPicker>
              <SearchPicker
                data={this.getPickerData(types.XMHGX)}
                extra="请选择"
                cascade={false}
                {...getFieldProps('XMHGX', {})}
              >
                <List.Item arrow="horizontal">项目合规性</List.Item>
              </SearchPicker>
              <SearchPicker
                data={this.getPickerData(types.VEC_TYPE)}
                extra="请选择"
                cascade={false}
                {...getFieldProps('VEC_TYPE', {})}
              >
                <List.Item arrow="horizontal">矢量化类型</List.Item>
              </SearchPicker>
            </List>
          </PanelContentContainer>
        </NavContentContainer>
      </div>
    );
  }
}
