import isCordova from './cordova';

const isRunInCordova = isCordova();

// 获取app版本号
export async function getVersionNumber() {
  // eslint-disable-next-line
  return isRunInCordova ? cordova.getAppVersion.getVersionNumber() : '1.0';
}
