import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { List, Slider } from 'antd-mobile';
import styles from './index.less';

export default class DownloadingItem extends PureComponent {
  static defaultProps = {
    dataSource: {},
  };

  static propTypes = {
    dataSource: PropTypes.object,
  };

  renderItem = item => {
    const { Item } = List;
    const { Brief } = Item;

    // 状态
    const statusClassName = 'status-deleting';
    const statusText = `正在删除${item.percent}%`;

    return (
      <Item multipleLine>
        {item.name}
        <div className={styles[statusClassName]}>{statusText}</div>
        <Brief>
          <Slider
            className={styles.slider}
            defaultValue={0}
            min={0}
            max={100}
            value={item.percent}
            disabled
            handleStyle={{ display: 'none' }}
          />
        </Brief>
      </Item>
    );
  };

  render() {
    const { dataSource } = this.props;
    return this.renderItem(dataSource);
  }
}
