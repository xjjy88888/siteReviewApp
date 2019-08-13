import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { TabBar } from 'antd-mobile';
import { Route } from 'dva/router';
import styles from './Main.less';
import NavContentContainer from '../components/NavContentContainer';
import Region from './Region';
import My from './My';

@connect()
export default class RegionIndex extends PureComponent {
  state = {
    selectedTab: 'region',
  };

  render() {
    const { routerData, match } = this.props;

    // tab页
    const tabs = [
      {
        title: '区域',
        key: 'region',
        icon: 'icon-region-select',
        component: Region,
      },
      {
        title: '我的',
        key: 'my',
        icon: 'icon-my',
        component: My,
      },
    ];

    const display = match.isExact ? 'block' : 'none';
    return (
      <div>
        <div style={{ display }}>
          <NavContentContainer top={0} bottom={0}>
            <TabBar unselectedTintColor="#949494" tintColor="#33A3F4" barTintColor="white">
              {tabs.map(item => (
                <TabBar.Item
                  title={item.title}
                  key={item.key}
                  icon={<div className={`iconfont ${item.icon} ${styles.icon}`} />}
                  selectedIcon={
                    <div className={`iconfont ${item.selectedIcon || item.icon} ${styles.icon}`} />
                  }
                  selected={this.state.selectedTab === `${item.key}`}
                  onPress={() => {
                    this.setState({
                      selectedTab: `${item.key}`,
                    });
                  }}
                >
                  {<item.component />}
                </TabBar.Item>
              ))}
            </TabBar>
          </NavContentContainer>
        </div>
        <Route path={`${match.url}/index`} component={routerData[`/main/index`].component} />
      </div>
    );
  }
}
