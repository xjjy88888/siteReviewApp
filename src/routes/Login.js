import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { WhiteSpace, InputItem, Button, Switch, List, Modal } from 'antd-mobile';
import { createForm } from 'rc-form';
import classNames from 'classnames';
import styles from './Login.less';
import config from '../config';

// 参考https://design.alipay.com/develop/web/components/form/
@connect(({ login, loading }) => ({
  login,
  submitting: loading.effects['login/login'],
}))
@createForm()
export default class Login extends PureComponent {
  componentDidMount() {
    // this.props.form.validateFields();
    //调用退出登录，假如内存占用存在的情况下，释放占用内存
    this.props.dispatch({
      type: 'login/logout',
    });

    this.getVersion();
  }

  getVersion = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'login/getVersion',
      callback: (v1, v2) => {
        // console.log(v1, v2);
        if (v1 !== v2.v) {
          if (v2.must) {
            window.open(config.downloadApkUrl);
          } else {
            Modal.alert('检查更新', `当前版本为${v1}，最新版本为${v2.v}，是否去更新？`, [
              {
                text: '否',
              },
              {
                text: '是',
                onPress: () => {
                  window.open(config.downloadApkUrl);
                },
              },
            ]);
          }
        }
      },
    });
  };

  hasErrors = fieldsError => {
    return Object.keys(fieldsError).some(field => fieldsError[field]);
  };

  handleSubmit = () => {
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.props.dispatch({
          type: 'login/login',
          payload: {
            username: values.username,
            userName: values.username,
            password: values.password,
            isReserve: values.isReserve ? 1 : 0,
            landTime: new Date().getTime(),
          },
        });
      }
    });
  };

  render() {
    const {
      submitting,
      login: { user, isReserve, localVersion, onlineVersion },
    } = this.props;
    const { getFieldProps, getFieldsError } = this.props.form;
    const { Item } = List;

    const loginStr =
      localStorage.getItem('login') ||
      JSON.stringify({
        username: '',
        password: '',
        isReserve: false,
      });

    const login = JSON.parse(loginStr);

    return (
      <div className={styles.main}>
        <div className={styles.top}>
          <div className={styles.desc}>生产建设项目水土保持信息化监管系统</div>
          <div className={styles.title}>
            <span className={classNames('iconfont', 'icon-region-logo', styles.logo)} />
            <span>现场复核</span>
          </div>
          <div className={styles.appVersionNumber}>V{localVersion}</div>
        </div>
        <div className={styles.center}>
          <WhiteSpace size="lg" />
          <InputItem
            {...getFieldProps('username', {
              rules: [{ required: true }],
              initialValue: login.username,
            })}
            type="text"
            placeholder="请输入用户名"
            clear
          />
          <WhiteSpace size="lg" />
          <InputItem
            {...getFieldProps('password', {
              rules: [{ required: true }],
              initialValue: login.password,
            })}
            type="password"
            placeholder="请输入登录密码"
          />
          <WhiteSpace size="lg" />
          <Item
            extra={
              <Switch
                {...getFieldProps('isReserve', {
                  valuePropName: 'checked',
                  initialValue: login.isReserve,
                })}
                platform="android"
              />
            }
          >
            记住用户名与密码
          </Item>
          <WhiteSpace size="lg" />
          <Button
            type="primary"
            onClick={this.handleSubmit}
            disabled={this.hasErrors(getFieldsError())}
            loading={submitting}
          >
            登录
          </Button>
          {/* <a href="#">市县登录</a> */}
          {/* <a href="bdapp://map/direction?destination=39.98871,116.43234&mode=driving">驾车导航</a> */}
        </div>
      </div>
    );
  }
}
