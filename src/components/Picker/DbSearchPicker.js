import React, { Component } from 'react';
import { Picker, SearchBar } from 'antd-mobile';
import PropTypes from 'prop-types';
import styles from './index.less';

// 初始选择项为空，检索时查询数据库的Picker
// 参考https://github.com/ant-design/ant-design/blob/master/components/form/demo/customized-form-controls.md
export default class DbSearchPicker extends Component {
  static propTypes = {
    idField: PropTypes.string.isRequired,
    nameField: PropTypes.string.isRequired,
    queryById: PropTypes.func.isRequired,
    queryByName: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    const { value } = this.props;

    // 当前选择值
    this.value = value;

    // 状态
    this.state = {
      data: [],
      value: undefined,
    };

    // 根据初始值设置数据
    this.setData(value);
  }

  componentWillReceiveProps(nextProps) {
    if ((nextProps.value || '').toString() !== (this.props.value || '').toString()) {
      const { value } = nextProps;

      // 当前选择值
      this.value = value;

      // 根据初始值设置数据
      this.setData(value);
    }
  }

  // Picker确定后
  onPickerChange = value => {
    this.setData(value);
  };

  // Picker取消后
  onPickerDismiss = () => {
    this.setData(this.value);
  };

  // 搜索值改变
  onSearchChange = value => {
    const { queryByName, nameField, idField } = this.props;
    queryByName({ name: value }).then(items => {
      const result = items.map(item => {
        return {
          label: item[nameField],
          value: item[idField],
        };
      });

      this.setState({ data: [result], value: undefined });
    });
  };

  setData = changedValue => {
    const [id] = changedValue || [];
    const { queryById, nameField, idField } = this.props;

    // 根据id查找该值是否存在
    queryById({ id }).then(items => {
      const result = items.map(item => {
        return {
          label: item[nameField],
          value: item[idField],
        };
      });

      if (result.length > 1) {
        const data = [result];
        const value = [result[1].value];
        this.value = value;
        this.setState({ data, value });
        this.triggerChange(value);
      } else {
        this.setState({ data: [result], value: [''] });
        this.triggerChange('');
      }
    });
  };

  triggerChange = changedValue => {
    // Should provide an event to pass value to Form.
    const { onChange } = this.props;
    if (onChange) {
      onChange(changedValue);
    }
  };

  render() {
    const { data, value, ...rest } = this.props;

    return (
      <Picker
        {...rest}
        data={this.state.data}
        value={this.state.value}
        className={styles.picker}
        title={
          <SearchBar
            placeholder="搜索"
            className={styles.searchBar}
            onChange={this.onSearchChange}
          />
        }
        onChange={this.onPickerChange}
        onDismiss={this.onPickerDismiss}
      />
    );
  }
}
