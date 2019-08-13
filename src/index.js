import dva from 'dva';
import createLoading from 'dva-loading';
import { Toast } from 'antd-mobile';
import './index.less';
import { initShareDB } from './services/localApi';
import isCordova from './utils/cordova';
import { processTileBackground } from './services/tileDownloadManager';

// https://dvajs.com/guide/
// 1. Initialize
const app = dva({
  onError(e) {
    Toast.fail(`发生错误，请联系管理员！`, 3);
    console.log(e);
  },
});

// 2. Plugins
app.use(createLoading());

// 3. Model
// app.model(require('./models/example').default);

// 4. Router
app.router(require('./router').default);

// 添加设备准备事件监听
const isRunInCordova = isCordova();
if (isRunInCordova) {
  document.addEventListener('deviceready', onDeviceReady, false);
  // Register the event listener
  document.addEventListener('backbutton', onBackKeyDown, false);
} else {
  onDeviceReady();
}

// cordova设备准备完毕处理事件
function onDeviceReady() {
  allRun();

  if (isRunInCordova) {
    cordovaRun();
  } else {
    webRun();
  }
}

// 所有环境都执行
function allRun() {
  // 初始化数据库
  initShareDB().then(() => {
    // 5. Start
    app.start('#root');
  });
}

// cordova环境执行
function cordovaRun() {
  // 后台处理瓦片
  processTileBackground();
}

/* eslint-disable */
function onBackKeyDown() {
  goback();
}

function goback() {
  // 判断第一次返回history state中是否赋值，null为第一次进行返回事件，给state赋值length属性
  if (history.state === null) {
    history.replaceState(history.length, null, null);
  } else {
    history.replaceState(history.state, null, null);
  }

  if (history.state > 1) {
    setTimeout(function() {
      history.go(-1);
      history.replaceState(history.state - 1, null, null);
    }, 100);
  } else {
    window.plugins.toast.showShortCenter(
      '再按一次退出',
      function(success) {
        console.log('toast success: ' + success);
      },
      function(error) {
        alert('toast error: ' + error);
      }
    );
    document.removeEventListener('backbutton', onBackKeyDown, false); //注销返回键

    //3秒后重新注册
    var intervalID = window.setInterval(function() {
      window.clearInterval(intervalID);
      document.addEventListener('backbutton', onBackKeyDown, false); //返回键
    }, 2000);
  }
}

// web环境执行
function webRun() {}
