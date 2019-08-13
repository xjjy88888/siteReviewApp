import React, { PureComponent } from 'react';
import { connect } from 'dva';
import TouchFeedback from 'rmc-feedback';
import { NavBar, Icon, List, Result, Modal } from 'antd-mobile';
import NavContentContainer from '../../components/NavContentContainer';
import PanelContentContainer from '../../components/PanelContentContainer';

@connect(({ index, project, spot }) => ({
  index,
  project,
  spot,
}))
export default class ProjectRelationSpots extends PureComponent {
  // 定位图斑
  onItemClick = item => {
    Modal.alert('提示', `跳转至图斑：${item.QDNM}`, [
      { text: '取消', onPress: () => console.log('cancle') },
      {
        text: '确定',
        onPress: () =>
          this.props.dispatch({
            type: 'spot/showEditPage',
            payload: {
              selectedId: item.ID,
            },
          }),
      },
    ]);
  };

  render() {
    const {
      project: { spotsArry },
    } = this.props;
    const { Item } = List;

    let content;
    const myImg = src => (
      <img src={src} style={{ fill: '#F13642', width: '60px', height: '60px' }} alt="" />
    );
    if (spotsArry.length > 0) {
      content = (
        <List renderHeader={() => `共${spotsArry.length}条记录`}>
          {spotsArry.map(item => (
            <Item
              multipleLine
              extra={<div className="iconfont icon-map global-icon-normal" />}
              onClick={() => this.onItemClick(item)}
            >
              {item.QDNM}
            </Item>
          ))}
        </List>
      );
    } else {
      content = (
        <div>
          <Result
            img={myImg('https://gw.alipayobjects.com/zos/rmsportal/GIyMDJnuqmcqPLpHCSkj.svg')}
            title="暂无图斑编号"
            message="该项目未关联图斑"
          />
        </div>
      );
    }

    return (
      <div>
        <NavBar
          mode="dark"
          icon={
            <TouchFeedback activeClassName="primary-feedback-active">
              <Icon type="left" />
            </TouchFeedback>
          }
          onLeftClick={() =>
            this.props.dispatch({
              type: 'index/goBack',
            })
          }
        >
          图斑编号
        </NavBar>
        <NavContentContainer>
          <PanelContentContainer>{content}</PanelContentContainer>
        </NavContentContainer>
      </div>
    );
  }
}
