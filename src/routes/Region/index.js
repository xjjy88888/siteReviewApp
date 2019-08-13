import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { NavBar } from 'antd-mobile';
import RegionList from '../../components/RegionList';
import NavContentContainer from '../../components/NavContentContainer';
import PanelContentContainer from '../../components/PanelContentContainer';

@connect(({ region }) => ({
  region,
}))
export default class Region extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'region/fetch',
    });
  }

  onItemClick = item => {
    this.props.dispatch({
      type: 'region/showIndex',
      payload: {
        selected: item,
      },
    });
  };

  render() {
    const {
      region: { data },
    } = this.props;
    return (
      <div>
        <NavBar mode="dark" rightContent={[]}>
          区域选择
        </NavBar>
        <NavContentContainer>
          <PanelContentContainer>
            <RegionList onItemClick={this.onItemClick} dataSource={data} />
          </PanelContentContainer>
        </NavContentContainer>
      </div>
    );
  }
}
