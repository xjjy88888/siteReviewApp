import React, { PureComponent } from 'react';
import styles from './index.less';

export default class PanelContentContainer extends PureComponent {
  render() {
    const { children } = this.props;
    return <div className={styles['pane-wrap']}>{children}</div>;
  }
}
