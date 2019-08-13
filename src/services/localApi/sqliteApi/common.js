import { guid } from '../../../utils/util';

// 将查询出的记录转化为模型数组
const toModels = rows => {
  const models = [];
  for (let i = 0; i < rows.length; i += 1) {
    models.push(rows.item(i));
  }
  return models;
};

// 删除数据库
// eslint-disable-next-line
const deleteDatabase = name => {
  window.sqlitePlugin.deleteDatabase({
    name: `${name}.db`,
    location: 'default',
  });
};

// 打开数据库
const openDatabase = name => {
  const db = window.sqlitePlugin.openDatabase({
    name: `${name}.db`,
    location: 'default',
  });

  return db;
};

export { guid, toModels, deleteDatabase, openDatabase };
