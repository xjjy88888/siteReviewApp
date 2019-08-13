import React, { PureComponent, Fragment } from 'react';
import PropTypes from 'prop-types';
import { List, Button } from 'antd-mobile';
import styles from './index.less';

export default class DownloadedItem extends PureComponent {
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

  renderItem = (item, expand, onButtonClick, onClick) => {
    const { Item } = List;
    // const { Brief } = Item;

    // 状态
    const statusClassName = 'status-downloaded';
    const statusText = `已下载`;

    /*
    // 箭头
    const arrow = expand ? 'up' : 'down';

    // 是否渲染按钮
    let buttons;
    if (expand) {
      buttons = this.renderButtons(item, onButtonClick);
    } */

    return (
      <Item multipleLine onClick={() => onClick(item)}>
        {item.name}
        <div className={styles[statusClassName]}>
          {statusText}
          {/* <Icon type={arrow} size="xxs" className={styles.arrow} /> */}
        </div>
        {/* <Brief>{buttons}</Brief> */}
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
            onButtonClick('delete', item);
          }}
        >
          删除
        </Button>
      </Fragment>
    );
  };

  render() {
    const { dataSource, expand, onClick, onButtonClick } = this.props;
    return this.renderItem(dataSource, expand, onClick, onButtonClick);
  }
}
