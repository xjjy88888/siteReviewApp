// 检测是否为cordova
export default function isCordova() {
  return (
    (window.cordova || window.PhoneGap || window.phonegap) &&
    /* eslint-disable */
    /^file:\/{3}[^\/]/i.test(window.location.href) &&
    /ios|iphone|ipod|ipad|android/i.test(navigator.userAgent)
  );
}
