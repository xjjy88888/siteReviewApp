import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { List } from 'antd-mobile';
import { toDateTimeFormatStr } from '@/utils/util';
import PullListView from '../PullListView';

export default class CsUnitListView extends PureComponent {
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
      row1.ID !== row2.ID || row1.DP_NAME !== row2.DP_NAME || row1.OTIME !== row2.OTIME;

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
        thumb={
          <div className="iconfont icon-project-item global-icon-normal global-icon-selected" />
        }
        multipleLine
        onClick={() => onItemClick(item)}
        key={item.ID}
      >
        {item.DP_NAME}
        <Brief>
          操作时间：
          {toDateTimeFormatStr(item.OTIME)}
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
