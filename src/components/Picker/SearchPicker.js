import React, { Component } from 'react';
import { Picker, SearchBar } from 'antd-mobile';
import styles from './index.less';

// 初始选择项为数组，检索时在数组中查询的Picker
// 参考https://github.com/ant-design/ant-design/blob/master/components/form/demo/customized-form-controls.md
export default class SearchPicker extends Component {
  constructor(props) {
    super(props);
    const { data, value } = this.props;

    // 原始值及当前选择值
    this.data = data;
    this.value = value;

    // 状态
    this.state = {
      data,
      value,
    };
  }

  // Picker确定后
  onPickerChange = value => {
    this.value = value;
    this.setState({ data: this.data, value });
    this.triggerChange(value);
  };

  // Picker取消后
  onPickerDismiss = () => {
    this.setState({ data: this.data, value: this.value });
  };

  // 搜索值改变
  onSearchChange = value => {
    // 过滤选项
    const result = this.data[0].filter(item => item.label.indexOf(value) >= 0);

    // 判断之前选中的值是否在过滤项之中，从而设置选中的值
    let isValueValid = false;
    if (Array.isArray(this.state.value)) {
      const [current] = this.state.value;
      if (result.some(item => item.value === current)) {
        isValueValid = true;
      }
    }
    if (isValueValid) {
      this.setState({ data: [result] });
    } else {
      this.setState({ data: [result], value: undefined });
    }
  };

  triggerChange = changedValue => {
    // Should provide an event to pass value to Form.
    const { onChange } = this.props;
    if (onChange) {
      onChange(changedValue);
    }
  };

  render() {
    const { data, ...rest } = this.props;
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
