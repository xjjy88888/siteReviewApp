import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { List } from 'antd-mobile';
import PullListView from '../PullListView';

export default class ProjectListView extends PureComponent {
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
      row1.SWC_P_ID !== row2.SWC_P_ID ||
      row1.PRO_NAME !== row2.PRO_NAME ||
      row1.CS_UNIT_ID !== row2.CS_UNIT_ID ||
      row1.RP_AGNT_ID !== row2.RP_AGNT_ID ||
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
        thumb={
          <div className="iconfont icon-project-item global-icon-normal global-icon-selected" />
        }
        multipleLine
        onClick={() => onItemClick(item)}
        key={item.SWC_P_ID}
      >
        {item.PRO_NAME}
        <Brief>
          建设单位：
          {item.CS_UNIT_ID}
          <br />
          批复机构：
          {item.RP_AGNT_ID}
          <br />
          是否有红线：
          {item.SHAPE ? '是' : '否'}
          {/* <br />
          关联图斑个数：
          {item.number} */}
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
