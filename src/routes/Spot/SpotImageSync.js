import React, { PureComponent, Fragment } from 'react';
import { Icon, NavBar, WhiteSpace, ActivityIndicator, Switch, Flex } from 'antd-mobile';
import Circle from 'react-circle';
import { connect } from 'dva';
import { createForm } from 'rc-form';
import TouchFeedback from 'rmc-feedback';
import NavContentContainer from '../../components/NavContentContainer';
import CircleButton from '../../components/CircleButton';
import { process, setProcessCallback } from '../../services/spotImagesSyncManager';
import styles from './index.less';

@connect(({ spot, login, loading }) => ({
  spot,
  login,
  loading: loading.effects['spot/queryAllCounts'],
}))
@createForm()
export default class SpotImageSync extends PureComponent {
  state = {
    // 0未同步，1正在同步，2同步完成
    status: 0,

    // 仅同步本地修改
    isOnlySyncLocalEdit: true,

    // 进度
    percent: 0,
  };

  componentDidMount() {
    const { dispatch } = this.props;

    // 获取数量
    dispatch({
      type: 'spot/queryAllCounts',
    });
  }

  onLeftClick = () => {
    this.props.dispatch({
      type: 'index/goBack',
    });
  };

  onClick = () => {
    const { status } = this.state;
    const {
      login: { user },
      spot: { id },
    } = this.props;

    if (status === 0) {
      this.setState({
        status: 1,
      });

      // 设置回调函数
      setProcessCallback(
        // 同步进度回调函数
        percent => {
          this.setState({
            percent,
          });
        },

        // 同步完成回调函数
        () => {
          this.setState({
            status: 2,
          });

          const { dispatch } = this.props;

          // 重新获取在线和离线数量
          dispatch({
            type: 'spot/queryAllCounts',
          });

          // // 重新获取图斑信息
          // dispatch({
          //   type: 'spot/queryRecordById',
          //   payload: { id },
          // });
        }
      );

      // 处理
      process(user, this.state.isOnlySyncLocalEdit, id);
    }
  };

  renderContent = () => {
    const { status, percent, isOnlySyncLocalEdit } = this.state;
    if (status === 0) {
      return (
        <Fragment>
          <Flex>
            <Flex.Item style={{ textAlign: 'center' }}>
              <CircleButton text="同步" onClick={this.onClick} />
            </Flex.Item>
          </Flex>
          <Flex>
            <Flex.Item style={{ textAlign: 'center' }}>
              <Switch
                checked={isOnlySyncLocalEdit}
                onChange={value => this.setState({ isOnlySyncLocalEdit: value })}
              />
              &nbsp;
              {isOnlySyncLocalEdit ? '仅同步本地修改' : '同步全部'}
            </Flex.Item>
          </Flex>
          <WhiteSpace />
        </Fragment>
      );
    } else if (status === 1) {
      return (
        <Flex>
          <Flex.Item style={{ textAlign: 'center' }}>
            <Circle progress={percent} bgColor="#ddd" />{' '}
          </Flex.Item>
        </Flex>
      );
    } else {
      return (
        <Flex>
          <Flex.Item style={{ textAlign: 'center' }}>
            <CircleButton text="同步完成" onClick={this.onClick} />{' '}
          </Flex.Item>
        </Flex>
      );
    }
  };

  render() {
    const {
      spot: {
        onlineSpotImagesCount,
        localSpotImagesCount,
        addSpotImagesCount,
        updateSpotImagesCount,
        deleteSpotImagesCount,
      },
      loading,
    } = this.props;

    const loadingEl = (
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        <ActivityIndicator size="large" />
      </div>
    );

    const tdStyles = ['', styles.number, styles.number, styles.add, styles.update, styles.delete];

    const tableValues = [
      [
        '照片',
        onlineSpotImagesCount,
        localSpotImagesCount,
        addSpotImagesCount,
        updateSpotImagesCount,
        deleteSpotImagesCount,
      ],
    ];

    return (
      <Fragment>
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
          图斑照片同步
        </NavBar>
        <NavContentContainer>
          <WhiteSpace size="lg" />
          <div
            style={{
              backgroundColor: '#fff',
            }}
          >
            {this.renderContent()}
          </div>
          <WhiteSpace size="lg" />
          <table style={{ width: '100%' }}>
            <tbody>
              <tr>
                <th>类别</th>
                <th>云端</th>
                <th>本地</th>
                <th>新增</th>
                <th>修改</th>
                <th>删除</th>
              </tr>
              {tableValues.map((items, i) => (
                // eslint-disable-next-line
                <tr key={i}>
                  {items.map((item, j) => (
                    <td
                      // eslint-disable-next-line
                      key={j}
                      className={tdStyles[j]}
                      style={{ textAlign: 'center', height: '30px' }}
                    >
                      {item}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </NavContentContainer>
        {loading ? loadingEl : null}
      </Fragment>
    );
  }
}
