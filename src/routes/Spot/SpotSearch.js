import React, { PureComponent } from 'react';
import { connect } from 'dva';
import TouchFeedback from 'rmc-feedback';
import { List, InputItem, NavBar, Icon, Flex } from 'antd-mobile';
import { createForm } from 'rc-form';
import NavContentContainer from '../../components/NavContentContainer';
import PanelContentContainer from '../../components/PanelContentContainer';
import { SearchPicker } from '../../components/Picker';
import styles from './SpotSearch.less';

// 参考：
// https://design.alipay.com/develop/web/components/form/
// https://github.com/fis-components/rc-form
// http://react-component.github.io/form/
// https://reactjs.org/docs/forms.html
@connect(({ spot }) => ({
  spot,
}))
@createForm()
export default class SpotSearch extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;

    dispatch({
      type: 'spot/queryTypes',
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

    if (values.QDNM) result.push(`QDNM like '%${values.QDNM}%'`);

    if (values.QAREAmin) result.push(`QAREA >= ${values.QAREAmin}`);

    if (values.QAREAmax) result.push(`QAREA <= ${values.QAREAmax}`);

    if (values.EAREAmin) result.push(`EAREA >= ${values.EAREAmin}`);

    if (values.EAREAmax) result.push(`EAREA <= ${values.EAREAmax}`);

    let condition = this.getPickerWhere('BYD', values.BYD);
    if (condition) result.push(condition);

    condition = this.getPickerWhere('QDCS', values.QDCS);
    if (condition) result.push(condition);

    condition = this.getPickerWhere('QDTYPE', values.QDTYPE);
    if (condition) result.push(condition);

    condition = this.getPickerWhere('SEROSION', values.SEROSION);
    if (condition) result.push(condition);

    condition = this.getPickerWhere('QTYPE', values.QTYPE);
    if (condition) result.push(condition);

    condition = this.getYesOrNoPickerWhere('ISFOCUS', values.ISFOCUS);
    if (condition) result.push(condition);

    return result.join(' and ');
  };

  // 获取选择项的where条件
  getPickerWhere = (key, value) => {
    if (Array.isArray(value) && value.length > 0) {
      return `${key} = '${value[0]}'`;
    }
  };

  // 获取是否选择项的where条件
  getYesOrNoPickerWhere = (key, value) => {
    if (Array.isArray(value) && value.length > 0) {
      if (value[0] === '1') {
        return `${key} = '1'`;
      } else {
        return `${key} <> '1' or ${key} is null`;
      }
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

  handleSubmit = () => {
    this.props.form.validateFields((err, values) => {
      if (!err) {
        const where = this.getWhere(values);
        this.props.dispatch({
          type: 'spot/search',
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
      spot: { types },
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
          图斑查询
        </NavBar>
        <NavContentContainer>
          <PanelContentContainer>
            <List>
              <InputItem
                {...getFieldProps('QDNM', {
                  rules: [{ required: false }],
                })}
                type="text"
              >
                图斑编号：
              </InputItem>
              <Flex>
                <Flex.Item>
                  <InputItem {...getFieldProps('QAREAmin', {})} type="digit">
                    扰动面积：
                  </InputItem>
                </Flex.Item>
                <Flex.Item prefixCls={`${styles.item} am-flexbox`}>
                  <InputItem {...getFieldProps('QAREAmax', {})} type="digit" labelNumber={2}>
                    至
                  </InputItem>
                </Flex.Item>
              </Flex>
              <Flex>
                <Flex.Item>
                  <InputItem {...getFieldProps('EAREAmin', {})} type="digit" labelNumber={7}>
                    扰动超出面积：
                  </InputItem>
                </Flex.Item>
                <Flex.Item prefixCls={`${styles.item} am-flexbox`}>
                  <InputItem {...getFieldProps('EAREAmax', {})} type="digit" labelNumber={2}>
                    至
                  </InputItem>
                </Flex.Item>
              </Flex>
              <SearchPicker
                data={this.getPickerData(types.QTYPE)}
                extra="请选择"
                cascade={false}
                {...getFieldProps('QTYPE', {})}
              >
                <List.Item arrow="horizontal">扰动类型</List.Item>
              </SearchPicker>
              <SearchPicker
                data={this.getPickerData(types.BYD)}
                extra="请选择"
                cascade={false}
                {...getFieldProps('BYD', {})}
              >
                <List.Item arrow="horizontal">扰动合规性</List.Item>
              </SearchPicker>
              <SearchPicker
                data={this.getPickerData(types.QDTYPE)}
                extra="请选择"
                cascade={false}
                {...getFieldProps('QDTYPE', {})}
              >
                <List.Item arrow="horizontal">扰动变化类型</List.Item>
              </SearchPicker>
              <SearchPicker
                data={this.getPickerData(types.QDCS)}
                extra="请选择"
                cascade={false}
                {...getFieldProps('QDCS', {})}
              >
                <List.Item arrow="horizontal">建设状态</List.Item>
              </SearchPicker>
              <SearchPicker
                data={this.getPickerData(types.SEROSION)}
                extra="请选择"
                cascade={false}
                {...getFieldProps('SEROSION', {})}
              >
                <List.Item arrow="horizontal">土壤侵蚀强度</List.Item>
              </SearchPicker>
              <SearchPicker
                data={this.getPickerData(this.yesOrNoTypes)}
                extra="请选择"
                cascade={false}
                {...getFieldProps('ISFOCUS', {})}
              >
                <List.Item arrow="horizontal">是否重点监管</List.Item>
              </SearchPicker>
            </List>
          </PanelContentContainer>
        </NavContentContainer>
      </div>
    );
  }
}
