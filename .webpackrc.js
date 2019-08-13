import path from 'path';

function resolve(dir) {
  return path.join(__dirname, dir);
}

export default {
  entry: 'src/index.js',
  outputPath: '../cordova/www/',
  env: {
    development: {
      extraBabelPlugins: [
        'dva-hmr',
        ['import', { libraryName: 'antd-mobile', libraryDirectory: 'lib', style: true }],
      ],
      extraPostCSSPlugins: [],
    },
    production: {
      extraBabelPlugins: [
        ['import', { libraryName: 'antd-mobile', libraryDirectory: 'lib', style: true }],
      ],
      extraPostCSSPlugins: [],
    },
  },
  alias: {
    '@': resolve('src'),
  },
};
