import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { createForm } from 'rc-form';
import Circle from 'react-circle';
import TouchFeedback from 'rmc-feedback';
import { NavBar, WhiteSpace, Flex, Icon } from 'antd-mobile';
import CircleButton from '../../components/CircleButton';
import NavContentContainer from '../../components/NavContentContainer';
import PanelContentContainer from '../../components/PanelContentContainer';
import {
  setInstructionProcessCallback,
  InstructionProcess,
} from '../../services/downloadInstruction';

@connect(({ my }) => ({ my }))
@createForm()
export default class downloadInstruction extends PureComponent {
  constructor(props) {
    super(props);

    // 状态
    this.state = {
      // initalData: [],
      // 0未同步，1正在同步，2同步完成
      status: 0,

      // 进度
      percent: 0,
    };
  }

  onClick = () => {
    const { status } = this.state;

    if (status === 0) {
      this.setState({
        status: 1,
      });

      // 设置回调函数
      setInstructionProcessCallback(
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

          dispatch({
            type: 'my/fetch',
          });
        }
      );

      // 处理
      InstructionProcess();
    }
  };

  onLeftClick = () => {
    this.props.dispatch({
      type: 'index/goBack',
    });
  };

  renderContent = () => {
    const { status, percent } = this.state;

    if (status === 0) {
      return <CircleButton text="下载" onClick={this.onClick} />;
    } else if (status === 1) {
      return <Circle progress={percent} bgColor="#ddd" />;
    } else {
      return <CircleButton text="完成" onClick={this.onLeftClick} />;
    }
  };

  render() {
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
          使用说明
        </NavBar>
        <NavContentContainer>
          <PanelContentContainer>
            <WhiteSpace size="xl" />
            <div
              style={{
                backgroundColor: '#fff',
              }}
            >
              <Flex>
                <Flex.Item align="center"> {this.renderContent()}</Flex.Item>
              </Flex>
            </div>
            <WhiteSpace size="lg" />
            <div>
              <WhiteSpace />
              <Flex>
                <Flex.Item align="center">使用说明下载</Flex.Item>
              </Flex>
            </div>
          </PanelContentContainer>
        </NavContentContainer>
      </div>
    );
  }
}
