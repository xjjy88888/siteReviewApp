import React, { PureComponent } from 'react';
import { connect } from 'dva';
import TouchFeedback from 'rmc-feedback';
import { NavBar, Icon, Modal, Toast } from 'antd-mobile';
import CsUnitListView from '../../components/CsUnitListView';
import NavContentContainer from '../../components/NavContentContainer';
import PanelContentContainer from '../../components/PanelContentContainer';
import { queryCsUnits, queryCsUnitsCount } from '../../services/localApi';
import { guid } from '../../utils/util';

@connect(({ index, csUnit, login }) => ({
  index,
  csUnit,
  login,
}))
export default class CsUnit extends PureComponent {
  onLeftClick = () => {
    this.props.dispatch({
      type: 'index/goBack',
    });
  };

  // 查询
  onSearch = () => {
    const { dispatch } = this.props;
    Modal.prompt(
      '查询建设单位',
      '',
      [
        {
          text: '取消',
        },
        {
          text: '确定',
          onPress: value => {
            const result = [];
            if (value) result.push(`DP_NAME like '%${value}%'`);
            const where = result.join(' and ');
            dispatch({
              type: 'csUnit/search',
              payload: {
                where,
              },
            });
          },
        },
      ],
      'default',
      null,
      ['请输入建设单位名称']
    );
  };

  // 新增
  onAdd = () => {
    const {
      dispatch,
      login: { user },
    } = this.props;

    Modal.prompt(
      '新增建设单位',
      '',
      [
        {
          text: '取消',
        },
        {
          text: '确定',
          onPress: value =>
            new Promise(resolve => {
              if (value.trim() === '') {
                Toast.fail('建设单位名称不能为空！', 1);
              } else {
                const record = {
                  ID: guid(),
                  DP_NAME: value.trim(),
                  C_PERSON: user.userId,
                  C_TIME: new Date().getTime(),
                };

                dispatch({
                  type: 'csUnit/saveAddCsUnit',
                  payload: { record },
                  callback: result => {
                    const { success, message } = result;
                    if (success) {
                      resolve();
                    } else {
                      Toast.fail(message, 1);
                    }
                  },
                });
              }
            }),
        },
      ],
      'default',
      null,
      ['请输入建设单位名称']
    );
  };

  // 修改
  onItemClick = item => {
    const {
      dispatch,
      login: { user },
    } = this.props;

    dispatch({
      type: 'csUnit/queryRecordById',
      payload: { selectedId: item.ID },
      callback: selected => {
        Modal.prompt(
          '修改建设单位',
          '',
          [
            {
              text: '取消',
            },
            {
              text: '确定',
              onPress: value =>
                new Promise(resolve => {
                  if (value.trim() === '') {
                    Toast.fail('建设单位名称不能为空！', 1);
                  } else {
                    const record = {
                      ID: selected.ID,
                      DP_NAME: value.trim(),
                      M_PERSON: user.userId,
                      M_TIME: new Date().getTime(),
                      // eslint-disable-next-line
                      _v: selected._v,
                    };

                    dispatch({
                      type: 'csUnit/saveUpdateCsUnit',
                      payload: { record },
                      callback: result => {
                        const { success, message } = result;
                        if (success) {
                          resolve();
                        } else {
                          Toast.fail(message, 1);
                        }
                      },
                    });
                  }
                }),
            },
          ],
          'default',
          item.DP_NAME,
          ['请输入建设单位名称']
        );
      },
    });
  };

  // 查询下一页
  onQueryNextPage = async (where, pageIndex = 1) => {
    return queryCsUnits({
      where,
      limit: pageIndex * 10,
    });
  };

  // 查询数量
  onQueryTotalCount = async where => {
    return queryCsUnitsCount({ where });
  };

  render() {
    const {
      csUnit: { where, refresh },
    } = this.props;

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
          rightContent={[
            <TouchFeedback key="0" activeClassName="primary-feedback-active">
              <Icon type="search" style={{ marginRight: '16px' }} onClick={this.onSearch} />
            </TouchFeedback>,
            <TouchFeedback key="1" activeClassName="primary-feedback-active">
              <div
                className="iconfont icon-add global-icon-normal"
                style={{ marginRight: '16px' }}
                onClick={this.onAdd}
              />
            </TouchFeedback>,
          ]}
        >
          建设单位
        </NavBar>
        <NavContentContainer>
          <PanelContentContainer>
            <CsUnitListView
              onItemClick={this.onItemClick}
              onQueryNextPage={this.onQueryNextPage}
              onQueryTotalCount={this.onQueryTotalCount}
              where={where}
              refresh={refresh}
            />
          </PanelContentContainer>
        </NavContentContainer>
      </div>
    );
  }
}
