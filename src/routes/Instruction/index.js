import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { createForm } from 'rc-form';
import TouchFeedback from 'rmc-feedback';
import { NavBar, List, Modal, NoticeBar, WhiteSpace, Icon } from 'antd-mobile';
import NavContentContainer from '../../components/NavContentContainer';
import PanelContentContainer from '../../components/PanelContentContainer';
import { mimeTypes } from '../../utils/util';

@connect(({ index, my }) => ({
  index,
  my,
}))
@createForm()
export default class Instruction extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'my/fetch',
      payload: {},
    });
  }

  onLeftClick = () => {
    this.props.dispatch({
      type: 'index/goBack',
    });
  };

  // 下载界面
  download = () => {
    console.log('跳转');
    const { dispatch } = this.props;
    dispatch({
      type: 'my/showDownloadInstruction',
    });
  };

  openFile = PATH => {
    console.log(PATH);

    const appType = mimeTypes(PATH.substring(PATH.lastIndexOf('.') + 1));

    // eslint-disable-next-line
    cordova.plugins.fileOpener2.open(`${PATH}`, `${appType}`, {
      error(e) {
        console.log(`Error status:  ${e.status}  Error message:  ${e.message}`);
      },
      success() {
        console.log('file opened successfully');
      },
    });
  };

  renderContent = () => {
    const {
      my: { flag },
    } = this.props;

    if (flag === 0) {
      return (
        <div>
          <WhiteSpace size="lg" />
          <NoticeBar mode="link" onClick={() => this.download()}>
            请下载使用说明文档
          </NoticeBar>
        </div>
      );
    } else if (flag === 1) {
      return (
        <div>
          <WhiteSpace size="lg" />
          <NoticeBar mode="link" onClick={() => this.download()}>
            请更新使用说明文档
          </NoticeBar>
        </div>
      );
    } else {
      return (
        <div>
          <WhiteSpace size="lg" />
          <NoticeBar>请认真阅读使用说明文档</NoticeBar>
        </div>
      );
    }
  };

  render() {
    const { Item } = List;
    const { operation } = Modal;
    const {
      my: { data },
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
          rightContent={[]}
        >
          使用说明
        </NavBar>
        <NavContentContainer>
          <PanelContentContainer>
            {this.renderContent()}
            <List renderHeader={() => ''}>
              {data.map(item => (
                <Item
                  multipleLine
                  onClick={() =>
                    operation([{ text: '查看', onPress: () => this.openFile(item.PATH) }])
                  }
                >
                  {item.FILE_NAME}
                </Item>
              ))}
            </List>
          </PanelContentContainer>
        </NavContentContainer>
      </div>
    );
  }
}
