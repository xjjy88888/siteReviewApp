import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { TabBar } from 'antd-mobile';
import { Route } from 'dva/router';
import styles from './Index.less';
import NavContentContainer from '../components/NavContentContainer';
import Map from './Map';
import Spot from './Spot';
import Project from './Project';
import My from './My';

@connect(({ index }) => ({
  index,
}))
export default class Index extends PureComponent {
  state = {
    selectedTab: 'map',
  };

  // eslint-disable-next-line
  componentWillReceiveProps(nextProps) {
    const { selectedTab } = nextProps.location.state || {};
    if (selectedTab) {
      this.setState({ selectedTab });
    }
  }

  render() {
    const {
      routerData,
      match,
      index: {
        refreshSpots,
        refreshProjects,
        addPhotoPointToMap,
        addLabelPointToMap,
        refreshPhotoPoints,
        refreshLabelPoints,
        refreshMultipleSpots,
        refreshAllFeatures,
      },
    } = this.props;

    // tab页
    const tabs = [
      {
        title: '地图',
        key: 'map',
        icon: 'icon-map',
        component: (
          <Map
            refreshSpots={refreshSpots}
            refreshProjects={refreshProjects}
            addPhotoPointToMap={addPhotoPointToMap}
            addLabelPointToMap={addLabelPointToMap}
            refreshPhotoPoints={refreshPhotoPoints}
            refreshLabelPoints={refreshLabelPoints}
            refreshMultipleSpots={refreshMultipleSpots}
            refreshAllFeatures={refreshAllFeatures}
          />
        ),
      },
      {
        title: '图斑',
        key: 'spot',
        icon: 'icon-spot',
        component: <Spot />,
      },
      {
        title: '项目',
        key: 'project',
        icon: 'icon-project',
        component: <Project />,
      },
      {
        title: '我的',
        key: 'my',
        icon: 'icon-my',
        component: <My />,
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
                  {item.component}
                </TabBar.Item>
              ))}
            </TabBar>
          </NavContentContainer>
        </div>
        <Route
          path={`${match.url}/spot-edit`}
          component={routerData[`/main/index/spot-edit`].component}
        />
        <Route
          path={`${match.url}/spot-search`}
          component={routerData[`/main/index/spot-search`].component}
        />
        <Route
          path={`${match.url}/spot-imageSync`}
          component={routerData[`/main/index/spot-imageSync`].component}
        />
        <Route
          path={`${match.url}/spot-picture`}
          component={routerData[`/main/index/spot-picture`].component}
        />
        <Route
          path={`${match.url}/project-edit`}
          component={routerData[`/main/index/project-edit`].component}
        />
        <Route
          path={`${match.url}/project-search`}
          component={routerData[`/main/index/project-search`].component}
        />
        <Route
          path={`${match.url}/project-relationSpots`}
          component={routerData[`/main/index/project-relationSpots`].component}
        />
        <Route
          path={`${match.url}/offline-map`}
          component={routerData[`/main/index/offline-map`].component}
        />
        <Route
          path={`${match.url}/data-sync`}
          component={routerData[`/main/index/data-sync`].component}
        />
        <Route
          path={`${match.url}/attachment-sync`}
          component={routerData[`/main/index/attachment-sync`].component}
        />
        <Route
          path={`${match.url}/csUnit`}
          component={routerData[`/main/index/csUnit`].component}
        />
        <Route
          path={`${match.url}/instruction`}
          component={routerData[`/main/index/instruction`].component}
        />
        <Route
          path={`${match.url}/download-instruction`}
          component={routerData[`/main/index/download-instruction`].component}
        />
        <Route
          path={`${match.url}/photoPoint-edit`}
          component={routerData[`/main/index/photoPoint-edit`].component}
        />
        <Route
          path={`${match.url}/photoPoint-picture`}
          component={routerData[`/main/index/photoPoint-picture`].component}
        />
        <Route
          path={`${match.url}/labelPoint-edit`}
          component={routerData[`/main/index/labelPoint-edit`].component}
        />
        <Route
          path={`${match.url}/labelPoint-picture`}
          component={routerData[`/main/index/labelPoint-picture`].component}
        />
      </div>
    );
  }
}
