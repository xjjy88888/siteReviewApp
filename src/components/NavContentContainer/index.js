import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styles from './index.less';

export default class NavContentContainer extends PureComponent {
  static defaultProps = {
    top: 45,
    bottom: 0,
  };
  static propTypes = {
    top: PropTypes.number,
    bottom: PropTypes.number,
  };
  render() {
    const { top, bottom, children } = this.props;
    return (
      <div className={styles.container} style={{ top: `${top}px`, bottom: `${bottom}px` }}>
        {children}
      </div>
    );
  }
}
