import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

export default class CircleButton extends PureComponent {
  static defaultProps = {
    bgColor: 'rgb(51, 163, 244)',
    size: '100',
    text: '未命名',
    textColor: '#fff',
    textStyle: { font: 'bold 4rem Helvetica, Arial, sans-serif' },
    onClick: () => {},
  };

  static propTypes = {
    bgColor: PropTypes.string,
    size: PropTypes.string,
    text: PropTypes.string,
    textColor: PropTypes.string,
    textStyle: PropTypes.object,
    onClick: PropTypes.func,
  };

  text() {
    const { text, textColor, textStyle } = this.props;
    return (
      <text style={textStyle} fill={textColor} x="50%" y="50%" dx="-25" textAnchor="middle">
        {text}
      </text>
    );
  }

  render() {
    const { size, bgColor, onClick } = this.props;

    return (
      <svg width={size} height={size} viewBox="-25 -25 400 400" onClick={onClick}>
        <circle fill={bgColor} cx="175" cy="175" r="175" />
        {this.text()}
      </svg>
    );
  }
}
