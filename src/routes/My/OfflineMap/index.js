import React, { PureComponent } from 'react';
import { Icon, NavBar, Tabs } from 'antd-mobile';
import { connect } from 'dva';
import TouchFeedback from 'rmc-feedback';
import NavContentContainer from '../../../components/NavContentContainer';
// import DownloadMap from './DownloadMap';
import DownloadResultMap from './DownloadResultMap';
import DownloadManagement from './DownloadManagement';

@connect()
export default class OfflineMap extends PureComponent {
  state = {
    selectedTabIndex: 0,
  };

  onLeftClick = () => {
    this.props.dispatch({
      type: 'index/goBack',
    });
  };

  render() {
    // const tabs = [{ title: '影像下载' }, { title: '下载管理' }, { title: '已下载影像' }];
    const tabs = [{ title: '下载管理' }, { title: '已下载影像' }];
    return (
      <div>
        <NavBar
          mode="dark"
          icon={
            <TouchFeedback activeClassName="primary-feedback-active">
              <Icon type="left" />
            </TouchFeedback>
          }
          onLeftClick={this.onLeftClick}
          rightContent={[]}
        >
          离线地图
        </NavBar>
        <NavContentContainer>
          <Tabs
            tabs={tabs}
            initialPage={this.state.selectedTabIndex}
            page={this.state.selectedTabIndex}
            onTabClick={(tab, selectedTabIndex) => {
              this.setState({ selectedTabIndex });
            }}
            animated={false}
            useOnPan={false}
            swipeable={false}
            prerenderingSiblingsNumber={0}
          >
            {/* <DownloadMap
              goToTab={selectedTabIndex => {
                this.setState({ selectedTabIndex });
              }}
            /> */}
            <DownloadManagement />
            <DownloadResultMap />
          </Tabs>
        </NavContentContainer>
      </div>
    );
  }
}
