import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { List } from 'antd-mobile';

export default class SpotList extends PureComponent {
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
                <div className="iconfont icon-spot-item global-icon-normal global-icon-selected" />
              }
              multipleLine
              onClick={() => onItemClick(item)}
              key={item.ID}
            >
              {item.QDNM}
              <Brief>
                关联项目：{item.PRNM}
                <br />
                扰动合规性：{item.BYD}
              </Brief>
            </Item>
          ))}
        </List>
      </div>
    );
  }
}
