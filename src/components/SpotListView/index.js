import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { List } from 'antd-mobile';
import { toDateTimeFormatStr } from '@/utils/util';
import PullListView from '../PullListView';

export default class SpotListView extends PureComponent {
  static defaultProps = {
    where: '',
    onItemClick: () => {},
    onQueryNextPage: () => {},
    onQueryTotalCount: () => {},
  };

  static propTypes = {
    where: PropTypes.string,
    onItemClick: PropTypes.func,
    onQueryNextPage: PropTypes.func,
    onQueryTotalCount: PropTypes.func,
  };

  rowHasChanged = (row1, row2) => {
    const isChanged =
      row1.ID !== row2.ID ||
      row1.QDNM !== row2.QDNM ||
      row1.PRNM !== row2.PRNM ||
      row1.BYD !== row2.BYD ||
      row1.OTIME !== row2.OTIME;

    return isChanged;
  };

  renderRow = rowData => {
    const { Item } = List;
    const { Brief } = Item;
    const item = rowData;
    const { onItemClick } = this.props;
    return (
      <Item
        arrow="horizontal"
        thumb={<div className="iconfont icon-spot-item global-icon-normal global-icon-selected" />}
        multipleLine
        onClick={() => onItemClick(item)}
        key={item.ID}
      >
        {item.QDNM}
        <Brief>
          关联项目：
          {item.PRNM}
          <br />
          扰动合规性：
          {item.BYD}
          <br />
          创建时间：
          {toDateTimeFormatStr(item.CTIME)}
        </Brief>
      </Item>
    );
  };

  render() {
    return (
      <PullListView {...this.props} rowHasChanged={this.rowHasChanged} renderRow={this.renderRow} />
    );
  }
}
