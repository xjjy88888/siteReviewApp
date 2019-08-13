import React, { PureComponent, Fragment } from 'react';
import { Icon, NavBar, WhiteSpace, ActivityIndicator, InputItem, Button } from 'antd-mobile';
import Circle from 'react-circle';
import { connect } from 'dva';
import TouchFeedback from 'rmc-feedback';
import NavContentContainer from '../../../components/NavContentContainer';
import PanelContentContainer from '../../../components/PanelContentContainer';
import CircleButton from '../../../components/CircleButton';
import { process, setProcessCallback } from '../../../services/dataSyncManager';
import styles from './index.less';

@connect(({ dataSync, login, loading }) => ({
  dataSync,
  login,
  loading: loading.effects['dataSync/queryAllCounts'],
}))
export default class DataSync extends PureComponent {
  state = {
    // 0未同步，1正在同步，2同步完成
    status: 0,
    // 进度
    percent: 0,

    preserve: 0,
  };

  componentDidMount() {
    localStorage.setItem('preserve', 0);
    if (!localStorage.getItem('preserve_prev')) {
      localStorage.setItem('preserve_prev', 0);
    }
    const { dispatch } = this.props;

    // 获取数量
    dispatch({
      type: 'dataSync/queryAllCounts',
    });
  }

  onLeftClick = () => {
    this.props.dispatch({
      type: 'index/goBack',
    });
  };

  onClick = () => {
    const preserve = localStorage.getItem('preserve');
    localStorage.setItem('preserve_prev', preserve * 10e5);

    const { status } = this.state;
    const {
      login: { user },
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
            type: 'dataSync/queryAllCounts',
          });

          // 重新获取图斑列表
          dispatch({
            type: 'spot/refresh',
          });

          // 重新获取项目列表
          dispatch({
            type: 'project/refresh',
          });

          // 重新加载所有地图要素
          dispatch({
            type: 'index/refreshAllFeatures',
          });
        }
      );

      // 处理
      process(user);
    }
  };

  renderContent = () => {
    const { status, percent } = this.state;
    if (status === 0) {
      return <CircleButton text="同步" onClick={this.onClick} />;
    } else if (status === 1) {
      return <Circle progress={percent} bgColor="#ddd" />;
    } else {
      return <CircleButton text="同步完成" onClick={this.onClick} />;
    }
  };

  render() {
    const {
      dataSync: {
        onlineSpotsCount,
        localSpotsCount,
        onlineProjectsCount,
        localProjectsCount,
        onlineDictsCount,
        localDictsCount,
        onlineAdminAreasCount,
        localAdminAreasCount,
        onlineDeptsCount,
        localDeptsCount,
        onlineCsUnitsCount,
        localCsUnitsCount,
        onlinePhotoPointsCount,
        localPhotoPointsCount,
        onlineLabelPointsCount,
        localLabelPointsCount,
        addSpotsCount,
        updateSpotsCount,
        deleteSpotsCount,
        addProjectsCount,
        updateProjectsCount,
        deleteProjectsCount,
        addCsUnitsCount,
        updateCsUnitsCount,
        deleteCsUnitsCount,
        addPhotoPointsCount,
        updatePhotoPointsCount,
        deletePhotoPointsCount,
        addLabelPointsCount,
        updateLabelPointsCount,
        deleteLabelPointsCount,
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
          top: '45px',
        }}
      >
        <ActivityIndicator size="large" />
      </div>
    );

    const tdStyles = ['', styles.number, styles.number, styles.add, styles.update, styles.delete];

    const tableValues = [
      [
        '图斑',
        onlineSpotsCount,
        localSpotsCount,
        addSpotsCount,
        updateSpotsCount,
        deleteSpotsCount,
      ],
      [
        '项目',
        onlineProjectsCount,
        localProjectsCount,
        addProjectsCount,
        updateProjectsCount,
        deleteProjectsCount,
      ],
      [
        '建设单位',
        onlineCsUnitsCount,
        localCsUnitsCount,
        addCsUnitsCount,
        updateCsUnitsCount,
        deleteCsUnitsCount,
      ],
      // [
      //   '照片点',
      //   onlinePhotoPointsCount,
      //   localPhotoPointsCount,
      //   addPhotoPointsCount,
      //   updatePhotoPointsCount,
      //   deletePhotoPointsCount,
      // ],
      [
        '标注点',
        onlineLabelPointsCount,
        localLabelPointsCount,
        addLabelPointsCount,
        updateLabelPointsCount,
        deleteLabelPointsCount,
      ],
      ['批复机构', onlineDeptsCount, localDeptsCount, '-', '-', '-'],
      ['枚举类型', onlineDictsCount, localDictsCount, '-', '-', '-'],
      ['行政区划', onlineAdminAreasCount, localAdminAreasCount, '-', '-', '-'],
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
          数据同步
        </NavBar>
        <WhiteSpace size="lg" />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
          }}
        >
          {this.renderContent()}
        </div>
        <NavContentContainer top={160} bottom={0}>
          <PanelContentContainer>
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
            <WhiteSpace size="lg" />
            <span className="global-form-star" style={{ marginLeft: '20px' }}>
              *说明：图斑、项目仅同步用户所属单位涉及县的数据
            </span>
            <WhiteSpace size="lg" />
            {/* <InputItem
              type="money"
              maxLength={2}
              clear
              extra="%"
              value={this.state.preserve}
              onChange={v => {
                this.setState({ preserve: v });
                console.log(v / 10e5);
                localStorage.setItem('preserve', v / 10e5);
              }}
              onBlur={v => {
                if (!v) {
                  this.setState({ preserve: 0 });
                  localStorage.setItem('preserve', 0);
                }
              }}
            >
              抽稀度
            </InputItem> */}
            <span style={{ padding: '0 10px 0 20px', position: 'relative', top: -20 }}>
              抽稀度(%)
            </span>
            {[0, 10, 20, 50, 100].map(item => (
              <Button
                inline
                style={{
                  fontSize: 14,
                  minWidth: 40,
                  color: this.state.preserve === item ? '#fff' : '#000',
                  backgroundColor: this.state.preserve === item ? '#108ee9' : '#fff',
                }}
                onClick={() => {
                  this.setState({ preserve: item });
                  console.log(item / 10e5);
                  localStorage.setItem('preserve', item / 10e5);
                }}
              >
                {item}
              </Button>
            ))}
            <WhiteSpace size="lg" />
            <span className="global-form-star" style={{ marginLeft: '20px' }}>
              *上次抽稀度{localStorage.getItem('preserve_prev')}%
            </span>
            <br />
            <span className="global-form-star" style={{ marginLeft: '20px' }}>
              *当地图闪退时，请尝试抽稀，百分比越高，地图闪退的可能性越小，但同时图形失真度越高
            </span>
          </PanelContentContainer>
        </NavContentContainer>
        {loading ? loadingEl : null}
      </Fragment>
    );
  }
}
