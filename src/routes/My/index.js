import React, { PureComponent, Fragment } from 'react';
import { Toast, Icon, NavBar, WhiteSpace, Grid, List, Button, Modal } from 'antd-mobile';
import PropTypes from 'prop-types';
import { connect } from 'dva';
import TouchFeedback from 'rmc-feedback';
import { getVersionNumber } from '@/utils/version.js';
import NavContentContainer from '../../components/NavContentContainer';
import PanelContentContainer from '../../components/PanelContentContainer';
import styles from './index.less';
import config from '../../config';

@connect(({ login }) => ({
  login,
}))
export default class My extends PureComponent {
  static defaultProps = {
    hasGoBack: false,
  };

  static propTypes = {
    hasGoBack: PropTypes.bool,
  };

  componentDidMount() {
    this.getVersion();
  }

  getVersion = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'login/getVersion',
      callback: (v1, v2) => {
        // console.log(v1, v2);
        if (v1 !== v2.v) {
          if (v2.must) {
            window.open(config.downloadApkUrl);
          } else {
            Modal.alert('检查更新', `当前版本为${v1}，最新版本为${v2.v}，是否去更新？`, [
              {
                text: '否',
              },
              {
                text: '是',
                onPress: () => {
                  window.open(config.downloadApkUrl);
                },
              },
            ]);
          }
        }
      },
    });
  };

  onLeftClick = () => {
    this.props.dispatch({
      type: 'index/goBack',
    });
  };

  // grid单击处理事件
  onGridClick = item => {
    switch (item.text) {
      case '离线地图':
        this.props.dispatch({
          type: 'my/showOfflineMap',
          payload: {},
        });
        break;
      case '数据同步':
        this.props.dispatch({
          type: 'my/showDataSync',
          payload: {},
        });
        break;
      case '附件同步':
        this.props.dispatch({
          type: 'my/showAttachmentSync',
          payload: {},
        });
        break;
      default:
        Toast.info('敬请期待！', 1);
        break;
    }
  };

  // 列表项单击处理事件
  onItemClick = item => {
    const {
      login: { localVersion, onlineVersion },
    } = this.props;
    switch (item.text) {
      case '建设单位管理':
        this.props.dispatch({
          type: 'my/showCsUnitPage',
          payload: {},
        });
        break;
      case '当前版本':
        getVersionNumber().then(version => {
          Toast.info(`当前版本：${version}`, 1);
        });
        break;
      case '检查更新':
        if (onlineVersion !== localVersion) {
          Modal.alert(
            '检查更新',
            `当前版本为${localVersion}，最新版本为${onlineVersion}，是否去更新？`,
            [
              {
                text: '否',
              },
              {
                text: '是',
                onPress: () => {
                  window.open(config.downloadApkUrl, '_self');
                },
              },
            ]
          );
        } else {
          Toast.info('当前已是最新版本', 3);
        }
        break;
      case '使用说明':
        this.props.dispatch({
          type: 'my/showInstructionPage',
          payload: {},
        });
        break;
      default:
        Toast.info('敬请期待！', 1);
        break;
    }
  };

  handleLogout = () => {
    this.props.dispatch({
      type: 'login/logout',
    });
  };

  render() {
    const commonFunctions = [
      {
        icon: 'icon-map-offline',
        text: `离线地图`,
      },
      {
        icon: 'icon-data-sync',
        text: `数据同步`,
      },
      {
        icon: 'icon-data-download',
        text: `附件同步`,
      },
    ];
    const listFunctions = [
      [
        {
          text: '建设单位管理',
        },
      ],
      [
        {
          text: '当前版本',
        },
      ],
      [
        {
          text: '检查更新',
        },
      ],
      [
        {
          text: '使用说明',
        },
      ],
    ];

    // 是否有返回按钮
    const {
      hasGoBack,
      login: {
        localVersion,
        onlineVersion,
        user: { trueName, userName },
      },
    } = this.props;

    const navBarAttr = hasGoBack
      ? {
          icon: (
            <TouchFeedback activeClassName="primary-feedback-active">
              <Icon type="left" />
            </TouchFeedback>
          ),
          onLeftClick: this.onLeftClick,
        }
      : {};
    return (
      <div>
        <NavBar mode="dark" {...navBarAttr} rightContent={[]}>
          我的
        </NavBar>
        <NavContentContainer>
          <PanelContentContainer>
            <div className={styles.dark}>
              <List.Item arrow="horizontal" key="0">
                {trueName}
                <List.Item.Brief>{userName}</List.Item.Brief>
              </List.Item>
            </div>
            <List>
              <div className={styles['grid-title']}>常用功能</div>
              <Grid
                data={commonFunctions}
                activeStyle
                columnNum={commonFunctions.length}
                hasLine={false}
                square={false}
                onClick={this.onGridClick}
                renderItem={item => (
                  <div>
                    <div className={`iconfont ${item.icon}`} />
                    <div className={styles['grid-item-text']}>
                      <span>{item.text}</span>
                    </div>
                  </div>
                )}
              />
            </List>
            <WhiteSpace />
            {listFunctions.map((items, i) => (
              // eslint-disable-next-line
              <Fragment key={i}>
                <List>
                  {items.map(item => (
                    <List.Item
                      arrow="horizontal"
                      extra={
                        item.text === '当前版本'
                          ? localVersion
                          : item.text === '检查更新'
                          ? onlineVersion
                          : ''
                      }
                      onClick={() => this.onItemClick(item)}
                      key={item.text}
                    >
                      <div style={{ fontSize: 14 }}>{item.text}</div>
                    </List.Item>
                  ))}
                </List>
                <WhiteSpace />
              </Fragment>
            ))}
            <WhiteSpace size="xl" />
            <Button onClick={this.handleLogout}>退出登录</Button>
          </PanelContentContainer>
        </NavContentContainer>
      </div>
    );
  }
}
