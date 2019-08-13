import React, { PureComponent, Fragment } from 'react';
import { NavBar, Tabs, Icon } from 'antd-mobile';
import { connect } from 'dva';
import TouchFeedback from 'rmc-feedback';
import SpotListView from '../../components/SpotListView';
import NavContentContainer from '../../components/NavContentContainer';
import { querySpots, querySpotsCount } from '../../services/localApi';

@connect(({ index, spot }) => ({
  index,
  spot,
}))
export default class Spot extends PureComponent {
  onLeftClick = () => {
    this.props.dispatch({
      type: 'index/goBack',
    });
  };

  onSearch = () => {
    this.props.dispatch({
      type: 'spot/showSearchPage',
      payload: {},
    });
  };

  onItemClick = item => {
    this.props.dispatch({
      type: 'spot/showEditPage',
      payload: {
        selectedId: item.ID,
      },
    });
  };

  // 查询下一页未调查图斑
  onQueryNextPageUnFinishedSpots = async (where, pageIndex = 1) => {
    const result = [];
    if (where) result.push(where);
    result.push('(isreview <> 1 or isreview is null)');

    return querySpots({
      where: result.join(' and '),
      limit: pageIndex * 10,
    });
  };

  // 查询未调查图斑数量
  onQueryTotalCountUnFinishedSpots = async where => {
    const result = [];
    if (where) result.push(where);
    result.push('(isreview <> 1 or isreview is null)');

    return querySpotsCount({ where: result.join(' and ') });
  };

  // 查询下一页已调查图斑
  onQueryNextPageFinishedSpots = async (where, pageIndex = 1) => {
    const result = [];
    if (where) result.push(where);
    result.push('(isreview = 1)');

    return querySpots({
      where: result.join(' and '),
      limit: pageIndex * 10,
    });
  };

  // 查询已调查图斑数量
  onQueryTotalCountFinishedSpots = async where => {
    const result = [];
    if (where) result.push(where);
    result.push('(isreview = 1)');

    return querySpotsCount({ where: result.join(' and ') });
  };

  render() {
    const tabs = [{ title: '未调查图斑' }, { title: '已调查图斑' }];
    const {
      spot: { where, refresh },
    } = this.props;

    // 是否展示查询之后的取消键
    let cancel = <Icon type="cross" />;
    if (typeof where === 'string' && where.length === 0) {
      cancel = null;
    }

    return (
      <Fragment>
        <NavBar
          mode="dark"
          icon={cancel}
          onLeftClick={() =>
            this.props.dispatch({
              type: 'spot/search',
              payload: {
                where: '',
              },
            })
          }
          rightContent={[
            <TouchFeedback key="0" activeClassName="primary-feedback-active">
              <Icon type="search" style={{ marginRight: '16px' }} onClick={this.onSearch} />
            </TouchFeedback>,
          ]}
        >
          图斑
        </NavBar>
        <NavContentContainer>
          <Tabs tabs={tabs} initialPage={0} animated={false} useOnPan={false}>
            <SpotListView
              onItemClick={this.onItemClick}
              onQueryNextPage={this.onQueryNextPageUnFinishedSpots}
              onQueryTotalCount={this.onQueryTotalCountUnFinishedSpots}
              where={where}
              refresh={refresh}
            />
            <SpotListView
              onItemClick={this.onItemClick}
              onQueryNextPage={this.onQueryNextPageFinishedSpots}
              onQueryTotalCount={this.onQueryTotalCountFinishedSpots}
              where={where}
              refresh={refresh}
            />
          </Tabs>
        </NavContentContainer>
      </Fragment>
    );
  }
}
