import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { List } from 'antd-mobile';

export default class ProjectList extends PureComponent {
  static defaultProps = {
    onItemClick: () => {},
    dataSource: [],
  };

  static propTypes = {
    onItemClick: PropTypes.func,
    dataSource: PropTypes.array,
  };

  render() {
    const { onItemClick, dataSource } = this.props;
    const { Item } = List;
    const { Brief } = Item;
    return (
      <div style={{ height: '100%', width: '100%' }}>
        <List>
          {dataSource.map(item => (
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
                建设单位：{item.CS_UNIT_ID}
                <br />
                批复机构：{item.RP_AGNT_ID}
              </Brief>
            </Item>
          ))}
        </List>
      </div>
    );
  }
}
