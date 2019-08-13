import moment from 'moment';
// import CryptoJS from 'crypto-js';
import { createShareTables } from './createTables';
import { guid, toModels, openDatabase } from './common';

// 共享数据库
let db;

// 初始化数据库
export async function initShareDB() {
  // 数据库名称
  const dbName = 'xcfh';

  // 打开数据库
  db = openDatabase(dbName);

  // 创建表
  await createShareTables(db);
}

// 关闭数据库
export async function closeShareDB() {
  db.close();
}

//-----------------------------------------------------------------------------------------------------
// 登录
export async function login({ username, password }) {
  // const passwordMd5 = CryptoJS.MD5(password).toString();

  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT * FROM user where userName=? and password=?`,
      [username, password],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`登录出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 保存用户信息
export async function saveUserInfo(params) {
  const {
    userId,
    userName,
    password,
    trueName,
    dwid,
    dwmc,
    dwdm,
    fsdm,
    regionArea,
    underArea,
    isReserve,
    landTime,
  } = params;
  return new Promise((resolve, reject) => {
    db.sqlBatch(
      [
        [`delete from user where userId = ?`, [userId]],
        [
          `insert into user(userId,userName,password,trueName,dwid,dwmc,dwdm,fsdm,regionArea,underArea,isReserve,landTime) values (?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            userId,
            userName,
            password,
            trueName,
            dwid,
            dwmc,
            dwdm,
            fsdm,
            regionArea,
            underArea,
            isReserve,
            landTime,
          ],
        ],
      ],
      () => {
        resolve();
      },
      error => {
        console.log(`保存用户信息出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 获取最后一个登陆用户的信息
export async function getLastLandUser() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT * FROM user ORDER BY landTime DESC LIMIT 1`,
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`获取最后一个登陆用户的信息出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

//-----------------------------------------------------------------------------------------------------
// 查询瓦片下载信息列表
export async function queryTileDownloadInfos() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      'SELECT * FROM tileDownloadInfo order by createTime asc',
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询瓦片下载信息出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询瓦片下载信息是否已存在
export async function isTileDownloadInfoExist({ bbox }) {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT count(*) as mycount FROM tileDownloadInfo where bbox=?`,
      [bbox],
      rs => {
        resolve(rs.rows.item(0).mycount > 0);
      },
      error => {
        console.log(`查询瓦片下载信息是否已存在: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 添加瓦片下载信息
export async function addTileDownloadInfo({ bbox }) {
  return new Promise((resolve, reject) => {
    db.executeSql(
      'insert into tileDownloadInfo(id, name, bbox, createTime, isFinished, percent, isPaused) values(?,?,?,?,?,?,?)',
      [guid(), bbox, bbox, moment().format('YYYY-MM-DD HH:mm:ss'), 0, 0, 0],
      () => {
        resolve();
      },
      error => {
        console.log(`添加瓦片下载信息出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 更新瓦片下载信息
export async function updateTileDownloadInfo(params) {
  const columnNames = [];
  const columnValues = [];
  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      if (key !== 'id') {
        columnNames.push(`${key}=?`);
        columnValues.push(params[key]);
      }
    }
  }
  columnValues.push(params.id);
  return new Promise((resolve, reject) => {
    db.executeSql(
      `update tileDownloadInfo set ${columnNames.join(',')} where id=?`,
      columnValues,
      () => {
        resolve();
      },
      error => {
        console.log(`更新瓦片下载信息出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 删除瓦片下载信息、同时将其添加至瓦片删除信息中
export async function removeTileDownloadInfo({ id }) {
  return new Promise((resolve, reject) => {
    db.sqlBatch(
      [
        [
          `insert into tileDeleteInfo(id,name,bbox,deleteTime,percent) select id,name,bbox,?,? from tileDownloadInfo where id = ?`,
          [moment().format('YYYY-MM-DD HH:mm:ss'), 0, id],
        ],
        [`delete from tileDownloadInfo where id = ?`, [id]],
      ],
      () => {
        resolve();
      },
      error => {
        console.log(`删除瓦片下载信息出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询瓦片删除信息列表
export async function queryTileDeleteInfos() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      'SELECT * FROM tileDeleteInfo order by deleteTime asc',
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询瓦片删除信息出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 更新瓦片删除信息
export async function updateTileDeleteInfo(params) {
  const columnNames = [];
  const columnValues = [];
  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      if (key !== 'id') {
        columnNames.push(`${key}=?`);
        columnValues.push(params[key]);
      }
    }
  }
  columnValues.push(params.id);
  return new Promise((resolve, reject) => {
    db.executeSql(
      `update tileDeleteInfo set ${columnNames.join(',')} where id=?`,
      columnValues,
      () => {
        resolve();
      },
      error => {
        console.log(`更新瓦片删除信息出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 删除瓦片删除信息
export async function removeTileDeleteInfo({ id }) {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `delete from tileDeleteInfo where id = ?`,
      [id],
      () => {
        resolve();
      },
      error => {
        console.log(`删除瓦片删除信息出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// --------------------------------------------------------------
// 添加使用说明文档
export async function addInstructionBatch({ records }) {
  const sqlArr = records.map(item => {
    return [
      `insert into instruction (ID,FILE_NAME,TYPE,PATH)
      values (?,?,?,?)`,
      [item.ID, item.FILE_NAME, item.TYPE, item.PATH],
    ];
  });

  return new Promise((resolve, reject) => {
    db.sqlBatch(
      sqlArr,
      () => {
        resolve();
      },
      error => {
        console.log(`添加使用说明文档出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询使用说明文档
export async function queryInstruction() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      'select * from instruction',
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询使用说明文档出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 清空使用说明文档
export async function emptyInstruction() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      'delete from instruction',
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`清空使用说明文档出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}
