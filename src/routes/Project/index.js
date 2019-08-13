import React, { PureComponent } from 'react';
import { connect } from 'dva';
import TouchFeedback from 'rmc-feedback';
import { NavBar, Icon, Tabs } from 'antd-mobile';
import ProjectListView from '../../components/ProjectListView';
import NavContentContainer from '../../components/NavContentContainer';
import PanelContentContainer from '../../components/PanelContentContainer';
import { queryProjects, queryProjectsCount } from '../../services/localApi';

@connect(({ index, project }) => ({
  index,
  project,
}))
export default class Project extends PureComponent {
  onLeftClick = () => {
    this.props.dispatch({
      type: 'index/goBack',
    });
  };

  onSearch = () => {
    this.props.dispatch({
      type: 'project/showSearchPage',
      payload: {},
    });
  };

  onAdd = () => {
    this.props.dispatch({
      type: 'project/showEditPage',
      payload: {
        selectedId: null,
      },
    });
  };

  onItemClick = item => {
    this.props.dispatch({
      type: 'project/showEditPage',
      payload: {
        selectedId: item.SWC_P_ID,
      },
    });
  };

  // 查询下一页有图形项目
  onQueryNextPageShape = async (where, pageIndex = 1) => {
    const result = [];
    if (where) result.push(where);
    result.push('SHAPE is not null');

    return queryProjects({
      where: result.join(' and '),
      limit: pageIndex * 10,
    });
  };

  // 查询有图形项目数量
  onQueryTotalCountShape = async where => {
    const result = [];
    if (where) result.push(where);
    result.push('SHAPE is not null');

    return queryProjectsCount({ where: result.join(' and ') });
  };

  // 查询下一页无图形项目
  onQueryNextPageNoShape = async (where, pageIndex = 1) => {
    const result = [];
    if (where) result.push(where);
    result.push('SHAPE is null');

    return queryProjects({
      where: result.join(' and '),
      limit: pageIndex * 10,
    });
  };

  // 查询无图形项目数量
  onQueryTotalCountNoShape = async where => {
    const result = [];
    if (where) result.push(where);
    result.push('SHAPE is null');

    return queryProjectsCount({ where: result.join(' and ') });
  };

  render() {
    const tabs = [{ title: '有图形项目' }, { title: '无图形项目' }];
    const {
      project: { where, refresh },
    } = this.props;

    // 是否展示查询之后的返回键
    let cancel = <Icon type="cross" />;
    if (typeof where === 'string' && where.length === 0) {
      cancel = null;
    }

    return (
      <div>
        <NavBar
          mode="dark"
          icon={cancel}
          onLeftClick={() =>
            this.props.dispatch({
              type: 'project/search',
              payload: {
                where: '',
              },
            })
          }
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
          项目
        </NavBar>
        <NavContentContainer>
          <PanelContentContainer>
            <Tabs tabs={tabs} initialPage={0} animated={false} useOnPan={false}>
              <ProjectListView
                onItemClick={this.onItemClick}
                onQueryNextPage={this.onQueryNextPageShape}
                onQueryTotalCount={this.onQueryTotalCountShape}
                where={where}
                refresh={refresh}
              />
              <ProjectListView
                onItemClick={this.onItemClick}
                onQueryNextPage={this.onQueryNextPageNoShape}
                onQueryTotalCount={this.onQueryTotalCountNoShape}
                where={where}
                refresh={refresh}
              />
            </Tabs>
          </PanelContentContainer>
        </NavContentContainer>
      </div>
    );
  }
}
