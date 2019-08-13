import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { List } from 'antd-mobile';

export default class RegionList extends PureComponent {
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
    return (
      <div style={{ height: '100%', width: '100%' }}>
        <List>
          {dataSource.map(item => (
            <Item
              arrow="horizontal"
              thumb={
                <div className="iconfont icon-region-item global-icon-normal global-icon-selected" />
              }
              multipleLine
              onClick={() => onItemClick(item)}
              key={item.name}
            >
              {item.name}
            </Item>
          ))}
        </List>
      </div>
    );
  }
}
