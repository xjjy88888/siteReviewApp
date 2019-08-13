import React, { PureComponent, Fragment } from 'react';
import PropTypes from 'prop-types';
import { List, Slider, Icon, Button } from 'antd-mobile';
import styles from './index.less';
import { xyzToObjects } from '../../utils/util';

export default class PausedItem extends PureComponent {
  static defaultProps = {
    dataSource: {},
    expand: false,
    onClick: () => {},
    onButtonClick: () => {},
  };

  static propTypes = {
    dataSource: PropTypes.object,
    expand: PropTypes.bool,
    onClick: PropTypes.func,
    onButtonClick: PropTypes.func,
  };

  renderItem = (item, expand, onClick, onButtonClick) => {
    const { Item } = List;
    const { Brief } = Item;

    // 状态
    const statusClassName = 'status-paused';
    const statusText = `已暂停${item.percent}%`;
    const xyzObj = xyzToObjects(item.xyz);
    const pausedInfo = `切片级别:${xyzObj.listIndex} 行号:${xyzObj.x} 列号:${xyzObj.y}`;
    const number = `已下载数量:${xyzObj.index}`;

    // 箭头
    const arrow = expand ? 'up' : 'down';

    // 是否渲染按钮
    let buttons;
    if (expand) {
      buttons = this.renderButtons(item, onButtonClick);
    }

    return (
      <Item multipleLine onClick={() => onClick(item)}>
        {item.name}
        <div className={styles[statusClassName]}>
          {statusText}
          <Icon type={arrow} size="xxs" className={styles.arrow} />
        </div>
        <Brief>
          {pausedInfo}
          <br />
          {number}
          <Slider
            className={styles.slider}
            defaultValue={0}
            min={0}
            max={100}
            value={item.percent}
            disabled
            handleStyle={{ display: 'none' }}
          />
          {buttons}
        </Brief>
      </Item>
    );
  };

  renderButtons = (item, onButtonClick) => {
    return (
      <Fragment>
        <Button
          size="small"
          inline
          className={styles.button}
          onClick={e => {
            e.stopPropagation();
            onButtonClick('start', item);
          }}
        >
          开始下载
        </Button>
        {/* <Button
          size="small"
          inline
          className={styles.button}
          onClick={e => {
            e.stopPropagation();
            onButtonClick('delete', item);
          }}
        >
          删除
        </Button> */}
      </Fragment>
    );
  };

  render() {
    const { dataSource, expand, onClick, onButtonClick } = this.props;
    return this.renderItem(dataSource, expand, onClick, onButtonClick);
  }
}
