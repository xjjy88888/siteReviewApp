import L from 'leaflet';
import '../utils/leaflet-tilelayer-cordova';
import {
  queryTileDownloadInfos,
  updateTileDownloadInfo,
  queryTileDeleteInfos,
  updateTileDeleteInfo,
  removeTileDeleteInfo,
} from './localApi';
import config from '../config';

const [zoomMin, zoomMax] = config.downloadLevels;

// 自己发布的影像瓦片图层
let layer = null;

// 是否正在处理
let isProcessing = false;

// 瓦片处理进度回调函数
let processTilePercentCallback;

// 瓦片处理完成回调函数
let processTileCompletedCallback;

// 获取图层
const getLayer = () => {
  const { offlineBasemap } = config;
  return new Promise(resolve => {
    if (layer === null) {
      layer = L.tileLayerCordova(
        `${offlineBasemap.url}/tile/{z}/{y}/{x}`,
        {
          minZoom: offlineBasemap.minZoom,
          maxZoom: offlineBasemap.maxZoom,
          folder: offlineBasemap.folder,
          name: offlineBasemap.name,
          debug: offlineBasemap.debug,
        },
        () => {
          resolve(layer);
        }
      );
    } else {
      resolve(layer);
    }
  });
};

// bbox转为bounds
const bboxToBounds = bbox => {
  const arr = bbox.split(',');
  const corner1 = L.latLng(parseFloat(arr[1]), parseFloat(arr[0]));
  const corner2 = L.latLng(parseFloat(arr[3]), parseFloat(arr[2]));
  const bounds = L.latLngBounds(corner1, corner2);

  return bounds;
};

// 将xyz信息转为对象
const xyzToObjects = xyz => {
  const arr = (xyz || '').split(',');
  if (arr.length === 4) {
    return {
      listIndex: parseInt(arr[0], 0),
      x: parseInt(arr[1], 0),
      y: parseInt(arr[2], 0),
      index: parseInt(arr[3], 0),
    };
  } else {
    return {};
  }
};

// 下载瓦片
const downloadTiles = (id, bbox, currentXYZ) => {
  isProcessing = true;
  const bounds = bboxToBounds(bbox);
  getLayer().then(theLayer => {
    const tilesInfo = theLayer.calculateTilesInfoFromBounds(bounds, zoomMin, zoomMax);
    Object.assign(tilesInfo, xyzToObjects(currentXYZ));
    theLayer.downloadTiles(
      // 1st param: a list indicating tiles to download
      tilesInfo,
      // 2nd param: overwrite existing tiles on disk?
      // if no then a tile already on disk will be kept, which can be a big time saver
      true,
      // 3rd param: progress callback
      // receives the number of tiles downloaded and the number of tiles total
      // caller can calculate a percentage, update progress bar, etc.
      // Cancel: if the progress callback returns false (not null or undefined, but false)
      // then BASE.downloadTiles() interprets that as a cancel order and will cease downloading tiles
      // great for a cancel button!
      (listIndex, x, y, done, total) => {
        const percent = Math.round((100 * done) / total);
        const xyz = `${listIndex},${x},${y},${done}`;
        updateTileDownloadInfo({ id, xyz, percent });
        if (processTilePercentCallback) {
          const isContinue = processTilePercentCallback(id, 'download');
          if (isContinue === false) {
            isProcessing = false;
            processTileBackground();
          }
          return isContinue;
        }
      },
      // 4th param: complete callback
      // no parameters are given, but we know we're done!
      () => {
        // for this demo, on success we use another L.TileLayer.Cordova feature and show the disk usage!
        isProcessing = false;
        updateTileDownloadInfo({ id, isFinished: 1 });
        processTileBackground();
        if (processTileCompletedCallback) processTileCompletedCallback(id, 'download');
      },
      // 5th param: error callback
      // parameter is the error message string
      error => {
        console.log(`Failed\nError code: ${error.code}`);
      }
    );
  });
};

// 删除瓦片
const deleteTiles = (id, bbox, currentXYZ) => {
  isProcessing = true;
  const bounds = bboxToBounds(bbox);
  getLayer().then(theLayer => {
    const tilesInfo = theLayer.calculateTilesInfoFromBounds(bounds, zoomMin, zoomMax);
    Object.assign(tilesInfo, xyzToObjects(currentXYZ));
    theLayer.deleteTiles(
      // 1st param: a list indicating tiles to delete
      tilesInfo,
      // 2rd param: progress callback
      (listIndex, x, y, done, total) => {
        const percent = Math.round((100 * done) / total);
        const xyz = `${listIndex},${x},${y},${done}`;
        updateTileDeleteInfo({ id, xyz, percent });
        if (processTilePercentCallback) {
          const isContinue = processTilePercentCallback(id, 'delete');
          if (isContinue === false) {
            isProcessing = false;
            processTileBackground();
          }
          return isContinue;
        }
      },
      // 3th param: complete callback
      () => {
        isProcessing = false;
        removeTileDeleteInfo({ id });
        processTileBackground();
        if (processTileCompletedCallback) processTileCompletedCallback(id, 'delete');
      },
      // 4th param: error callback
      error => {
        console.log(`Failed\nError code: ${error.code}`);
      }
    );
  });
};

// 设置瓦片处理回调函数
function setProcessTileCallback(processTilePercentCallbackFn, processTileCompletedCallbackFn) {
  processTilePercentCallback = processTilePercentCallbackFn;
  processTileCompletedCallback = processTileCompletedCallbackFn;
}

// 后台处理瓦片
function processTileBackground() {
  if (!isProcessing) {
    // 查询是否有瓦片需要删除
    queryTileDeleteInfos().then(items => {
      if (items.length > 0) {
        const item = items[0];
        deleteTiles(item.id, item.bbox, item.xyz);
      } else {
        // 下载瓦片
        downloadTileBackground();
      }
    });
  }

  // 下载瓦片
  function downloadTileBackground() {
    queryTileDownloadInfos().then(list => {
      const items = list.filter(item => item.isFinished === 0 && item.isPaused === 0);
      if (items.length > 0) {
        const item = items[0];
        downloadTiles(item.id, item.bbox, item.xyz);
      }
    });
  }
}

export { setProcessTileCallback, processTileBackground };
