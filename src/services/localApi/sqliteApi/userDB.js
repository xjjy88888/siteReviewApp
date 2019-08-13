import { createUserTables } from './createTables';
import { toModels, openDatabase } from './common';
import request from '../../../utils/request';

// 每个用户单独数据库
let db;

// 初始化数据库
export async function initUserDB(userName) {
  // 数据库名称
  const dbName = `xcfh-${userName}`;

  // 打开数据库
  db = openDatabase(dbName);

  // 创建表
  await createUserTables(db);
}

// 关闭数据库
export async function closeUserDB() {
  // console.log("关闭数据库");
  if(db){
    db.close();
  }
}

// 查询数量通用方法
const queryCount = (sql, errorMessage) => {
  return new Promise((resolve, reject) => {
    db.executeSql(
      sql,
      [],
      rs => {
        resolve(rs.rows.item(0).mycount);
      },
      error => {
        console.log(`${errorMessage}: ${error.message}`);
        reject(error.message);
      }
    );
  });
};

// 查询记录通用方法
export async function queryRecords(sql, paramArr, errorMessage) {
  return new Promise((resolve, reject) => {
    db.executeSql(
      sql,
      paramArr,
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`${errorMessage}: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 批量处理数据通用方法
export async function sqlBatch(sqlArr, errorMessage) {
  return new Promise((resolve, reject) => {
    db.sqlBatch(
      sqlArr,
      () => {
        resolve();
      },
      error => {
        console.log(`${errorMessage}: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

//-----------------------------------------------------------------------------------------------------
// 查询区域，@deprecated
export async function queryRegions() {
  return [];
}

//-----------------------------------------------------------------------------------------------------
// 根据ID查询图斑
export async function querySpotMapById({ id }) {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT ID, QDNM, BDID, ISREVIEW, PRID, spot._v, spot.SHAPE as SHAPE, project.SUP_UNIT as SUP_UNIT, project.PRO_NAME as PRNM, dict.DictValue as BYD FROM spotView spot left join projectView project on project.SWC_P_ID = spot.PRID left join dict on dict.TypeName='扰动合规性' and dict.DictId=spot.BYD where id=?`,
      [id],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`根据ID查询图斑出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 根据ID查询图斑
export async function querySpotById({ id }) {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT spot.*,project.SUP_UNIT FROM spotView spot left join projectView project on project.SWC_P_ID = spot.PRID where id=?`,
      [id],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`根据ID查询图斑出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 根据ID查询图斑用于地图显示
export async function querySpotByIdForMap({ id }) {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT ID, QDNM, COALESCE(spot.OTIME,spot.CTIME) as OTIME, PRID, BDID, ISREVIEW, spot.SHAPE as SHAPE, project.SUP_UNIT, project.PRO_NAME as PRNM, dict.DictValue as BYD FROM spotView spot left join projectView project on project.SWC_P_ID = spot.PRID left join dict on dict.TypeName='扰动合规性' and dict.DictId=spot.BYD where id=?`,
      [id],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`根据ID查询图斑用于地图显示出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 根据PRID查询关联图斑用于地图高亮显示
export async function querySpotByPRIDForMap({ PRID }) {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT ID, QDNM, COALESCE(spot.OTIME,spot.CTIME) as OTIME, PRID, BDID, ISREVIEW, spot.SHAPE as SHAPE, project.SUP_UNIT, project.PRO_NAME as PRNM, dict.DictValue as BYD FROM spotView spot left join projectView project on project.SWC_P_ID = spot.PRID left join dict on dict.TypeName='扰动合规性' and dict.DictId=spot.BYD where PRID=?`,
      [PRID],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`根据ID查询图斑用于地图显示出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 根据项目ID查询图斑用于地图显示
export async function querySpotsByProjectIdForMap({ id }) {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT ID, QDNM, COALESCE(spot.OTIME,spot.CTIME) as OTIME, PRID, BDID, ISREVIEW, spot.SHAPE as SHAPE, project.SUP_UNIT, project.PRO_NAME as PRNM, dict.DictValue as BYD FROM spotView spot left join projectView project on project.SWC_P_ID = spot.PRID left join dict on dict.TypeName='扰动合规性' and dict.DictId=spot.BYD where project.SWC_P_ID=?`,
      [id],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`根据项目ID查询图斑用于地图显示出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询现状库图斑
export async function querySpots(params = {}) {
  const { limit = 10, returnGeometry = false } = params;
  let { where } = params;
  if ((typeof where === 'string' && where.trim() === '') || where == null) {
    where = '1=1';
  }

  let geometryField = '';
  if (returnGeometry) {
    geometryField = ', spot.SHAPE as SHAPE ';
  }

  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT ID, QDNM, CTIME, PRID, spot._v, project.PRO_NAME as PRNM, dict.DictValue as BYD ${geometryField} FROM spotView spot left join projectView project on project.SWC_P_ID = spot.PRID left join dict on dict.TypeName='扰动合规性' and dict.DictId=spot.BYD where ${where} order by COALESCE(spot.OTIME,spot.CTIME) desc limit ?`,
      [limit],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询图斑列表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

export async function queryMapSpots(params = {}) {
  console.log(`查询现状库图斑152`, params);
  const { limit = 10, offset, returnGeometry = false } = params;
  let { where } = params;
  if ((typeof where === 'string' && where.trim() === '') || where == null) {
    where = '1=1';
  }

  let geometryField = '';
  if (returnGeometry) {
    geometryField = ', spot.SHAPE as SHAPE ';
  }
  console.log(`查询现状库图斑163,查询条数:${limit},offset:${offset}`, where);
  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT ID, QDNM, CTIME,PRID, spot._v, project.PRO_NAME as PRNM, dict.DictValue as BYD ${geometryField} FROM spotView spot left join projectView project on project.SWC_P_ID = spot.PRID left join dict on dict.TypeName='扰动合规性' and dict.DictId=spot.BYD where ${where} order by COALESCE(spot.OTIME,spot.CTIME) desc limit ? offset ?`,
      [limit, offset],
      rs => {
        console.log(`查询现状库图斑169`, rs);
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询图斑列表出错: ${error.message}`, error);
        reject(error.message);
      }
    );
  });
}

// 查询更新过的图斑
export async function queryUpdateSpots() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `select * from spot where ID in (select ID from spot where _v=3) order by ID, _v`,
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询更新过的图斑出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询图斑数量
export async function querySpotsCount(params = {}) {
  let { where } = params;
  if ((typeof where === 'string' && where.trim() === '') || where == null) {
    where = '1=1';
  }

  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT count(*) AS mycount FROM spotView where ${where}`,
      [],
      rs => {
        resolve(rs.rows.item(0).mycount);
      },
      error => {
        console.log(`查询图斑数量出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询图斑修改数量
export async function querySpotsModifyCounts() {
  const addSpotsCount = await queryCount(
    `SELECT count(*) AS mycount FROM spot where _v=2`,
    '查询图斑新增数量出错'
  );

  const updateSpotsCount = await queryCount(
    `SELECT count(*) AS mycount FROM spot where _v=3`,
    '查询图斑修改数量出错'
  );

  const deleteSpotsCount = await queryCount(
    `SELECT count(*) AS mycount FROM spot where _v=4`,
    '查询图斑删除数量出错'
  );

  return {
    addSpotsCount,
    updateSpotsCount,
    deleteSpotsCount,
  };
}

// 查询现状库图斑编号
export async function querySpotIds() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `select ID from spotView order by ID`,
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询现状库图斑编号出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 修改图斑
export async function updateSpot({ record }) {
  const count = await queryCount(
    `SELECT count(*) AS mycount FROM spotView where trim(QDNM)=trim('${record.QDNM}') and ID <> '${
      record.ID
    }'`,
    '查询图斑编号是否已存在出错'
  );

  return new Promise((resolve, reject) => {
    if (count > 0) {
      resolve({
        success: false,
        message: '该图斑编号已存在！',
      });
    } else {
      const { ID, _v, ...rest } = record;
      const sqlArr = [];

      // 未修改过，则生成插入语句
      if (_v === 1) {
        sqlArr.push([
          `insert into spot(ID,TBID,QDNM,PRID,QTYPE,QAREA,EAREA,QDCS,QDTYPE,BYD,SEROSION,ISFOCUS,ISREVIEW,ADDRESS,PROBLEM,PROPOSAL,STATE,MEMO,CPID,CTIME,DPID,DTIME,BPID,BDID,OTIME,XZQDM,SHAPE,_v) select ID,TBID,QDNM,PRID,QTYPE,QAREA,EAREA,QDCS,QDTYPE,BYD,SEROSION,ISFOCUS,ISREVIEW,ADDRESS,PROBLEM,PROPOSAL,STATE,MEMO,CPID,CTIME,DPID,DTIME,BPID,BDID,OTIME,XZQDM,SHAPE,3 from spot where ID=?`,
          [ID],
        ]);
      }

      // 生成更新语句
      const items = [];
      const values = [];
      for (const key in rest) {
        if ({}.hasOwnProperty.call(record, key)) {
          items.push(`${key}=?`);
          values.push(record[key]);
        }
      }
      values.push(ID);
      sqlArr.push([`update spot set ${items.join(',')} where (_v=2 or _v=3) and ID=?`, values]);

      db.sqlBatch(
        sqlArr,
        () => {
          resolve({
            success: true,
          });
        },
        error => {
          console.log(`修改图斑出错: ${error.message}`);
          reject(error.message);
        }
      );
    }
  });
}

// 清空图斑表
export async function emptySpots() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `delete from spot`,
      [],
      () => {
        resolve();
      },
      error => {
        console.log(`清空图斑表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 批量添加图斑
export async function addSpotsBatch({ records }) {
  const sqlArr = records.map(item => {
    const {
      id,
      tbid,
      qdnm,
      prid,
      qtype,
      qarea,
      earea,
      qdcs,
      qdtype,
      byd,
      serosion,
      isfocus,
      isreview,
      address,
      problem,
      proposal,
      state,
      memo,
      cpid,
      ctime,
      dpid,
      dtime,
      bpid,
      bdid,
      otime,
      xzqdm,
      geometry,
    } = item;
    return [
      `insert into spot (ID,TBID,QDNM,PRID,QTYPE,QAREA,EAREA,QDCS,QDTYPE,BYD,SEROSION,ISFOCUS,ISREVIEW,ADDRESS,PROBLEM,PROPOSAL,STATE,MEMO,CPID,CTIME,DPID,DTIME,BPID,BDID,OTIME,XZQDM,SHAPE,_v)
        values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        tbid,
        qdnm,
        prid,
        qtype,
        qarea,
        earea,
        qdcs,
        qdtype,
        byd,
        serosion,
        isfocus,
        isreview,
        address,
        problem,
        proposal,
        state,
        memo,
        cpid,
        ctime,
        dpid,
        dtime,
        bpid,
        bdid,
        otime,
        xzqdm,
        geometry,
        1,
      ],
    ];
  });

  return new Promise((resolve, reject) => {
    db.sqlBatch(
      sqlArr,
      () => {
        resolve();
      },
      error => {
        console.log(`批量插入图斑数据出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

//-----------------------------------------------------------------------------------------------------
// 根据ID查询项目
export async function queryProjectById({ id }) {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT * FROM projectView where SWC_P_ID=?`,
      [id],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`根据ID查询项目出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// DbSearchPicker根据ID查询项目
export async function queryDBProjectById({ id }) {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT * FROM projectView where SWC_P_ID=?`,
      [id],
      rs => {
        const data = toModels(rs.rows);
        data.unshift({ SWC_P_ID: '', PRO_NAME: '请选择' });
        resolve(data);
      },
      error => {
        console.log(`根据ID查询项目出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 根据名称查询项目列表
export async function queryProjectsByName({ name }) {
  let where = '';
  if (typeof name === 'string' && name.trim() !== '') {
    where = `where PRO_NAME like '%${name.trim()}%'`;
  } else {
    return [];
  }

  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT SWC_P_ID,PRO_NAME FROM projectView ${where} order by trim(PRO_NAME) limit 20`,
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`根据名称查询项目列表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// DbSearchPicker根据名称查询项目列表
export async function queryDBProjectsByName({ name }) {
  let where = '';
  if (typeof name === 'string' && name.trim() !== '') {
    where = `where PRO_NAME like '%${name.trim()}%'`;
  } else {
    return [];
  }

  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT SWC_P_ID,PRO_NAME FROM projectView ${where} order by trim(PRO_NAME) limit 20`,
      [],
      rs => {
        const data = toModels(rs.rows);
        data.unshift({ SWC_P_ID: '', PRO_NAME: '请选择' });
        resolve(data);
      },
      error => {
        console.log(`根据名称查询项目列表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询项目列表
export async function queryProjects(params = {}) {
  const { limit = 10, returnGeometry = true } = params;
  let { where } = params;
  if ((typeof where === 'string' && where.trim() === '') || where == null) {
    where = '1=1';
  }

  let geometryField = '';
  if (returnGeometry) {
    geometryField = ', SHAPE ';
  }

  const projects = await queryInfos(
    `SELECT project.SWC_P_ID,project.PRO_NAME, csUnit.DP_NAME as CS_UNIT_ID, dept.DP_NAME as RP_AGNT_ID,COALESCE(project.M_TIME,project.C_TIME) as OTIME ${geometryField} FROM projectView project left join csUnit on csUnit.ID = project.CS_UNIT_ID left join dept on dept.DP_ID=project.RP_AGNT_ID where ${where} order by COALESCE(project.M_TIME,project.C_TIME) desc limit ?`,
    [limit]
  );

  // const spots = await queryInfos('select * from spotView ', []);

  // const arry = [];
  // // 过滤项目对应的图斑数量
  // projects.forEach(project => {
  //   const relatedSpots = spots.filter(spot => spot.PRID === project.SWC_P_ID);
  //   arry.push({ ...project, number: relatedSpots.length });
  // });

  return projects;
}

// 查询
const queryInfos = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.executeSql(
      sql,
      params,
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询查询: ${error.message}`);
        reject(error.message);
      }
    );
  });
};

// 查询项目的关联图斑
export async function queryRelationSpotsById({ id }) {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `select * from spotView where PRID = ?`,
      [id],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询项目的关联图斑出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询新增的项目
export async function queryAddProjects() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `select * from project where _v=2`,
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询新增的项目出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询更新过的项目
export async function queryUpdateProjects() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `select * from project where SWC_P_ID in (select SWC_P_ID from project where _v=3) order by SWC_P_ID, _v`,
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询更新过的项目出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询项目数量
export async function queryProjectsCount(params = {}) {
  let { where } = params;
  if ((typeof where === 'string' && where.trim() === '') || where == null) {
    where = '1=1';
  }

  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT count(*) AS mycount FROM projectView where ${where}`,
      [],
      rs => {
        resolve(rs.rows.item(0).mycount);
      },
      error => {
        console.log(`查询项目数量出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询项目修改数量
export async function queryProjectsModifyCounts() {
  const addProjectsCount = await queryCount(
    `SELECT count(*) AS mycount FROM project where _v=2`,
    '查询项目新增数量出错'
  );

  const updateProjectsCount = await queryCount(
    `SELECT count(*) AS mycount FROM project where _v=3`,
    '查询项目修改数量出错'
  );

  const deleteProjectsCount = await queryCount(
    `SELECT count(*) AS mycount FROM project where _v=4`,
    '查询项目删除数量出错'
  );

  return {
    addProjectsCount,
    updateProjectsCount,
    deleteProjectsCount,
  };
}

// 添加项目
export async function addProject({ record }) {
  const {
    SWC_P_ID,
    VEC_TYPE,
    PRO_NAME,
    XMHGX,
    CS_UNIT_ID,
    RP_AGNT_ID,
    PRO_LEVEL,
    RP_NUM,
    RP_TIME,
    PRO_TYPE,
    PRO_CATE,
    PRO_NAT,
    CST_STATE,
    IPT_UNIT,
    SUP_UNIT,
    IVV_CNTY,
    C_PERSON,
    C_TIME,
    M_PERSON,
    M_TIME,
    DATA_STATE,
    MDID,
    MEMO,
  } = record;

  const count = await queryCount(
    `SELECT count(*) AS mycount FROM projectView where trim(PRO_NAME)=trim('${PRO_NAME}')`,
    '查询项目名称是否已存在出错'
  );

  return new Promise((resolve, reject) => {
    if (count > 0) {
      resolve({
        success: false,
        message: '该项目名称已存在！',
      });
    } else {
      const sqlArr = [
        [
          `insert into project (SWC_P_ID,VEC_TYPE,PRO_NAME,XMHGX,CS_UNIT_ID,RP_AGNT_ID,PRO_LEVEL,RP_NUM,RP_TIME,PRO_TYPE,PRO_CATE,PRO_NAT,CST_STATE,IPT_UNIT,SUP_UNIT,IVV_CNTY,C_PERSON,C_TIME,M_PERSON,M_TIME,DATA_STATE,MDID,MEMO,SHAPE,_v)
            values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            SWC_P_ID,
            VEC_TYPE,
            PRO_NAME,
            XMHGX,
            CS_UNIT_ID,
            RP_AGNT_ID,
            PRO_LEVEL,
            RP_NUM,
            RP_TIME,
            PRO_TYPE,
            PRO_CATE,
            PRO_NAT,
            CST_STATE,
            IPT_UNIT,
            SUP_UNIT,
            IVV_CNTY,
            C_PERSON,
            C_TIME,
            M_PERSON,
            M_TIME,
            DATA_STATE,
            MDID,
            MEMO,
            null,
            2,
          ],
        ],
      ];

      db.sqlBatch(
        sqlArr,
        () => {
          resolve({
            success: true,
          });
        },
        error => {
          console.log(`插入项目数据出错: ${error.message}`);
          reject(error.message);
        }
      );
    }
  });
}

// 修改项目
export async function updateProject({ record }) {
  const count = await queryCount(
    `SELECT count(*) AS mycount FROM projectView where trim(PRO_NAME)=trim('${
      record.PRO_NAME
    }') and SWC_P_ID <> '${record.SWC_P_ID}'`,
    '查询项目名称是否已存在出错'
  );

  return new Promise((resolve, reject) => {
    if (count > 0) {
      resolve({
        success: false,
        message: '该项目名称已存在！',
      });
    } else {
      const { SWC_P_ID, _v, ...rest } = record;
      const sqlArr = [];

      // 未修改过，则生成插入语句
      if (_v === 1) {
        sqlArr.push([
          `insert into project(SWC_P_ID,VEC_TYPE,PRO_NAME,XMHGX,CS_UNIT_ID,RP_AGNT_ID,PRO_LEVEL,RP_NUM,RP_TIME,PRO_TYPE,PRO_CATE,PRO_NAT,CST_STATE,IPT_UNIT,SUP_UNIT,IVV_CNTY,C_PERSON,C_TIME,M_PERSON,M_TIME,DATA_STATE,MDID,MEMO,SHAPE,_v) select SWC_P_ID,VEC_TYPE,PRO_NAME,XMHGX,CS_UNIT_ID,RP_AGNT_ID,PRO_LEVEL,RP_NUM,RP_TIME,PRO_TYPE,PRO_CATE,PRO_NAT,CST_STATE,IPT_UNIT,SUP_UNIT,IVV_CNTY,C_PERSON,C_TIME,M_PERSON,M_TIME,DATA_STATE,MDID,MEMO,SHAPE,3 from project where SWC_P_ID=?`,
          [SWC_P_ID],
        ]);
      }

      // 生成更新语句
      const items = [];
      const values = [];
      for (const key in rest) {
        if ({}.hasOwnProperty.call(record, key)) {
          items.push(`${key}=?`);
          values.push(record[key]);
        }
      }
      values.push(SWC_P_ID);
      sqlArr.push([
        `update project set ${items.join(',')} where (_v=2 or _v=3) and SWC_P_ID=?`,
        values,
      ]);

      db.sqlBatch(
        sqlArr,
        () => {
          resolve({
            success: true,
          });
        },
        error => {
          console.log(`修改项目出错: ${error.message}`);
          reject(error.message);
        }
      );
    }
  });
}

// 清空项目表
export async function emptyProjects() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `delete from project`,
      [],
      () => {
        resolve();
      },
      error => {
        console.log(`清空项目表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 批量添加项目
export async function addProjectsBatch({ records }) {
  const sqlArr = records.map(item => {
    const {
      swc_p_id,
      vec_type,
      pro_name,
      xmhgx,
      cs_unit_id,
      rp_agnt_id,
      pro_level,
      rp_num,
      rp_time,
      pro_type,
      pro_cate,
      pro_nat,
      cst_state,
      ipt_unit,
      sup_unit,
      ivv_cnty,
      c_person,
      c_time,
      m_person,
      m_time,
      data_state,
      mdid,
      memo,
      geometry,
    } = item;
    return [
      `insert into project (SWC_P_ID,VEC_TYPE,PRO_NAME,XMHGX,CS_UNIT_ID,RP_AGNT_ID,PRO_LEVEL,RP_NUM,RP_TIME,PRO_TYPE,PRO_CATE,PRO_NAT,CST_STATE,IPT_UNIT,SUP_UNIT,IVV_CNTY,C_PERSON,C_TIME,M_PERSON,M_TIME,DATA_STATE,MDID,MEMO,SHAPE,_v)
        values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        swc_p_id,
        vec_type,
        pro_name,
        xmhgx,
        cs_unit_id,
        rp_agnt_id,
        pro_level,
        rp_num,
        rp_time,
        pro_type,
        pro_cate,
        pro_nat,
        cst_state,
        ipt_unit,
        sup_unit,
        ivv_cnty,
        c_person,
        c_time,
        m_person,
        m_time,
        data_state,
        mdid,
        memo,
        geometry,
        1,
      ],
    ];
  });

  return new Promise((resolve, reject) => {
    db.sqlBatch(
      sqlArr,
      () => {
        resolve();
      },
      error => {
        console.log(`批量插入项目数据出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

//-----------------------------------------------------------------------------------------------------
// 查询字典列表
// typeName不能为空
// DictId可为空
export async function queryDicts({ typeName, DictId }) {
  if (typeName == null) {
    throw new Error('typeName不能为空');
  }
  const whereClauses = ['TypeName=?'];
  const whereValues = [typeName];
  if (DictId != null) {
    whereClauses.push('DictId=?');
    whereValues.push(DictId);
  }
  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT * FROM dict where ${whereClauses.join(' and ')} order by DictId`,
      whereValues,
      rs => {
        const data = toModels(rs.rows);
        data.unshift({ typeName, DictId: '', DictValue: '请选择' });
        resolve(data);
      },
      error => {
        console.log(`查询字典列表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询字典数量
export async function queryDictsCount() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      'SELECT count(*) AS mycount FROM dict',
      [],
      rs => {
        resolve(rs.rows.item(0).mycount);
      },
      error => {
        console.log(`查询字典数量出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 清空字典表
export async function emptyDicts() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `delete from dict`,
      [],
      () => {
        resolve();
      },
      error => {
        console.log(`清空字典表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 批量添加字典
export async function addDictsBatch({ records }) {
  const sqlArr = records.map(item => {
    return [
      `insert into dict (TypeName,DictId,DictValue)
        values (?,?,?)`,
      [item.TypeName, item.DictId, item.DictValue],
    ];
  });

  return new Promise((resolve, reject) => {
    db.sqlBatch(
      sqlArr,
      () => {
        resolve();
      },
      error => {
        console.log(`批量插入字典数据出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

//-----------------------------------------------------------------------------------------------------
// 查询行政区划数量
export async function queryAdminAreasCount() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      'SELECT count(*) AS mycount FROM adminArea',
      [],
      rs => {
        resolve(rs.rows.item(0).mycount);
      },
      error => {
        console.log(`查询行政区划数量出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 清空行政区划表
export async function emptyAdminAreas() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `delete from adminArea`,
      [],
      () => {
        resolve();
      },
      error => {
        console.log(`清空行政区划表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 批量添加行政区划
export async function addAdminAreasBatch({ records }) {
  const sqlArr = records.map(item => {
    return [
      `insert into adminArea (QT_CTN_CODE,NA_CTN_NAME,QT_PARENT_CODE)
        values (?,?,?)`,
      [item.id, item.na_ctn_name, item.qt_parent_code],
    ];
  });

  return new Promise((resolve, reject) => {
    db.sqlBatch(
      sqlArr,
      () => {
        resolve();
      },
      error => {
        console.log(`批量插入行政区划数据出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 获取所有县市区
export async function getAllAdminArea() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT NA_CTN_NAME as label,QT_CTN_CODE as value,QT_PARENT_CODE as PID FROM adminArea order by QT_CTN_CODE`,
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`SELECT SQL statement ERROR: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

//-----------------------------------------------------------------------------------------------------
// 根据ID查询部门
export async function queryDeptById({ id }) {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT dept.*,a.NA_CTN_NAME as province,b.NA_CTN_NAME as city,c.NA_CTN_NAME as county FROM dept left join adminArea a on (substr(dept.XZQDM,1,2) || '0000')=a.QT_CTN_CODE left join adminArea b on (substr(dept.XZQDM,1,4) || '00')=b.QT_CTN_CODE left join adminArea c on dept.XZQDM=c.QT_CTN_CODE where DP_ID=?`,
      [id],
      rs => {
        const rows = toModels(rs.rows);
        const newRows = rows.map(item => {
          // 利用Set进行去重
          const adminArea = [...new Set([item.province, item.city, item.county])].join(',');
          const newName = adminArea ? `${item.DP_NAME}(${adminArea})` : item.DP_NAME;
          return { ...item, newName };
        });
        resolve(newRows);
      },
      error => {
        console.log(`根据ID查询部门出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// DbSearchPicker根据ID查询部门
export async function queryDBDeptById({ id }) {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT dept.*,a.NA_CTN_NAME as province,b.NA_CTN_NAME as city,c.NA_CTN_NAME as county FROM dept left join adminArea a on (substr(dept.XZQDM,1,2) || '0000')=a.QT_CTN_CODE left join adminArea b on (substr(dept.XZQDM,1,4) || '00')=b.QT_CTN_CODE left join adminArea c on dept.XZQDM=c.QT_CTN_CODE where DP_ID=?`,
      [id],
      rs => {
        const rows = toModels(rs.rows);
        const newRows = rows.map(item => {
          // 利用Set进行去重
          const adminArea = [...new Set([item.province, item.city, item.county])].join(',');
          const newName = adminArea ? `${item.DP_NAME}(${adminArea})` : item.DP_NAME;
          return { ...item, newName };
        });
        newRows.unshift({ DP_ID: '', newName: '请选择' });
        resolve(newRows);
      },
      error => {
        console.log(`根据ID查询部门出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询部门列表
export async function queryDepts({ name }) {
  let where = '';
  if (typeof name === 'string' && name.trim() !== '') {
    where = `where DP_NAME like '%${name.trim()}%' and DP_PF=1`;
  } else {
    return [];
  }

  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT dept.*,a.NA_CTN_NAME as province,b.NA_CTN_NAME as city,c.NA_CTN_NAME as county FROM dept left join adminArea a on (substr(dept.XZQDM,1,2) || '0000')=a.QT_CTN_CODE left join adminArea b on (substr(dept.XZQDM,1,4) || '00')=b.QT_CTN_CODE left join adminArea c on dept.XZQDM=c.QT_CTN_CODE ${where} limit 20`,
      [],
      rs => {
        const rows = toModels(rs.rows);
        const newRows = rows.map(item => {
          // 利用Set进行去重
          const adminArea = [...new Set([item.province, item.city, item.county])].join(',');
          const newName = adminArea ? `${item.DP_NAME}(${adminArea})` : item.DP_NAME;
          return { ...item, newName };
        });
        resolve(newRows);
      },
      error => {
        console.log(`查询部门列表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// DbSearchPicker查询部门列表
export async function queryDBDepts({ name }) {
  let where = '';
  if (typeof name === 'string' && name.trim() !== '') {
    where = `where DP_NAME like '%${name.trim()}%' and DP_PF=1`;
  } else {
    return [];
  }

  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT dept.*,a.NA_CTN_NAME as province,b.NA_CTN_NAME as city,c.NA_CTN_NAME as county FROM dept left join adminArea a on (substr(dept.XZQDM,1,2) || '0000')=a.QT_CTN_CODE left join adminArea b on (substr(dept.XZQDM,1,4) || '00')=b.QT_CTN_CODE left join adminArea c on dept.XZQDM=c.QT_CTN_CODE ${where} limit 20`,
      [],
      rs => {
        const rows = toModels(rs.rows);
        const newRows = rows.map(item => {
          // 利用Set进行去重
          const adminArea = [...new Set([item.province, item.city, item.county])].join(',');
          const newName = adminArea ? `${item.DP_NAME}(${adminArea})` : item.DP_NAME;
          return { ...item, newName };
        });
        newRows.unshift({ DP_ID: '', newName: '请选择' });
        resolve(newRows);
      },
      error => {
        console.log(`查询部门列表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询部门数量
export async function queryDeptsCount() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      'SELECT count(*) AS mycount FROM dept',
      [],
      rs => {
        resolve(rs.rows.item(0).mycount);
      },
      error => {
        console.log(`查询部门数量出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 清空部门表
export async function emptyDepts() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `delete from dept`,
      [],
      () => {
        resolve();
      },
      error => {
        console.log(`清空部门表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 批量添加部门
export async function addDeptsBatch({ records }) {
  const sqlArr = records.map(item => {
    return [
      `insert into dept (DP_ID,DP_NAME,DP_PF,DP_TYPE,DWDM,PARENT_ID,XZQDM,DP_DESCRIPTION)
        values (?,?,?,?,?,?,?,?)`,
      [
        item.DP_ID,
        item.DP_NAME,
        item.DP_PF,
        item.DP_TYPE,
        item.DWDM,
        item.PARENT_ID,
        item.XZQDM,
        item.DP_DESCRIPTION,
      ],
    ];
  });

  return new Promise((resolve, reject) => {
    db.sqlBatch(
      sqlArr,
      () => {
        resolve();
      },
      error => {
        console.log(`批量插入部门数据出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

//-----------------------------------------------------------------------------------------------------
// 根据ID查询标注点
export async function queryLabelPointById({ id }) {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT * FROM labelPointView  where ID=?`,
      [id],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`根据ID查询标注点出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 根据名称查询标注点列表
export async function queryLabelPointsByName({ name }) {
  let where = '';
  if (typeof name === 'string' && name.trim() !== '') {
    where = `where NAME like '%${name.trim()}%'`;
  } else {
    return [];
  }

  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT ID,NAME FROM labelPointView  ${where} order by trim(NAME) limit 20`,
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`根据名称查询标注点列表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询标注点列表
export async function queryLabelPoints(params = {}) {
  const { limit = 10, returnGeometry = false } = params;
  let { where } = params;
  if ((typeof where === 'string' && where.trim() === '') || where == null) {
    where = '1=1';
  }

  let geometryField = '';
  if (returnGeometry) {
    geometryField = ', SHAPE as SHAPE ';
  }

  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT ID,NAME ${geometryField} FROM labelPointView  where ${where} order by OTIME desc limit ?`,
      [limit],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询标注点列表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询新增的标注点
export async function queryAddLabelPoints() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `select * from labelPoint where _v=2`,
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询新增的标注点出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询更新过的标注点
export async function queryUpdateLabelPoints() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `select * from labelPoint where ID in (select ID from labelPoint where _v=3) order by ID, _v`,
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询更新过的标注点出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询删除的标注点
export async function queryDeleteLabelPoints() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `select ID,DPID,DTIME from labelPoint where _v=4`,
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询删除的标注点出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询标注点数量
export async function queryLabelPointsCount(params = {}) {
  let { where } = params;
  if ((typeof where === 'string' && where.trim() === '') || where == null) {
    where = '1=1';
  }

  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT count(*) AS mycount FROM labelPointView  where ${where}`,
      [],
      rs => {
        resolve(rs.rows.item(0).mycount);
      },
      error => {
        console.log(`查询标注点数量出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询标注点修改数量
export async function queryLabelPointsModifyCounts() {
  const addLabelPointsCount = await queryCount(
    `SELECT count(*) AS mycount FROM labelPoint where _v=2`,
    '查询标注点新增数量出错'
  );

  const updateLabelPointsCount = await queryCount(
    `SELECT count(*) AS mycount FROM labelPoint where _v=3`,
    '查询标注点修改数量出错'
  );

  const deleteLabelPointsCount = await queryCount(
    `SELECT count(*) AS mycount FROM labelPoint where _v=4`,
    '查询标注点删除数量出错'
  );

  return {
    addLabelPointsCount,
    updateLabelPointsCount,
    deleteLabelPointsCount,
  };
}

// 查询现状库标注点编号
export async function queryLabelPointIds() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `select ID from labelPointView order by ID`,
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询现状库标注点编号出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 添加标注点
export async function addLabelPoint({ record }) {
  const count = await queryCount(
    `SELECT count(*) AS mycount FROM labelPointView  where trim(NAME)=trim('${record.NAME}')`,
    '查询标注点名称是否已存在出错'
  );

  return new Promise((resolve, reject) => {
    if (count > 0) {
      resolve({
        success: false,
        message: '该标注点名称已存在！',
      });
    } else {
      const {
        ID,
        PRID,
        NAME,
        PROBLEM,
        PROPOSAL,
        MDID,
        MEMO,
        CPID,
        CTIME,
        DPID,
        DTIME,
        OTIME,
        SHAPE,
      } = record;
      const sqlArr = [
        [
          `insert into labelPoint (ID,PRID,NAME,PROBLEM,PROPOSAL,MDID,MEMO,CPID,CTIME,DPID,DTIME,OTIME,SHAPE,_v)
          values (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            ID,
            PRID,
            NAME,
            PROBLEM,
            PROPOSAL,
            MDID,
            MEMO,
            CPID,
            CTIME,
            DPID,
            DTIME,
            OTIME,
            SHAPE,
            2,
          ],
        ],
      ];

      db.sqlBatch(
        sqlArr,
        () => {
          resolve({
            success: true,
          });
        },
        error => {
          console.log(`插入标注点数据出错: ${error.message}`);
          reject(error.message);
        }
      );
    }
  });
}

// 修改标注点
export async function updateLabelPoint({ record }) {
  const count = await queryCount(
    `SELECT count(*) AS mycount FROM labelPointView  where trim(NAME)=trim('${
      record.NAME
    }') and ID <> '${record.ID}'`,
    '查询标注点名称是否已存在出错'
  );

  return new Promise((resolve, reject) => {
    if (count > 0) {
      resolve({
        success: false,
        message: '该标注点名称已存在！',
      });
    } else {
      const { ID, _v, ...rest } = record;
      const sqlArr = [];

      // 未修改过，则生成插入语句
      if (_v === 1) {
        sqlArr.push([
          `insert into labelPoint(ID,PRID,NAME,PROBLEM,PROPOSAL,MDID,MEMO,CPID,CTIME,DPID,DTIME,OTIME,SHAPE,_v) select ID,PRID,NAME,PROBLEM,PROPOSAL,MDID,MEMO,CPID,CTIME,DPID,DTIME,OTIME,SHAPE,3 from labelPoint where ID=?`,
          [ID],
        ]);
      }

      // 生成更新语句
      const items = [];
      const values = [];
      for (const key in rest) {
        if ({}.hasOwnProperty.call(record, key)) {
          items.push(`${key}=?`);
          values.push(record[key]);
        }
      }
      values.push(ID);
      sqlArr.push([
        `update labelPoint set ${items.join(',')} where (_v=2 or _v=3) and ID=?`,
        values,
      ]);

      db.sqlBatch(
        sqlArr,
        () => {
          resolve({
            success: true,
          });
        },
        error => {
          console.log(`修改标注点出错: ${error.message}`);
          reject(error.message);
        }
      );
    }
  });
}

// 根据关联ID删除标注点
export async function deleteLabelPointById({ ID, DPID, DTIME }) {
  const removeSqls = [
    `delete FROM labelPoint where ID = '${ID}' and (_v=2 or _v=3)`,
    [`update labelPoint set _v=4,DPID=?,DTIME=? where ID = '${ID}' and _v=1`, [DPID, DTIME]],
  ];
  await sqlBatch(removeSqls, '根据关联ID删除标注点出错');
}

// 清空标注点表
export async function emptyLabelPoints() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `delete from labelPoint`,
      [],
      () => {
        resolve();
      },
      error => {
        console.log(`清空标注点表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 批量添加标注点
export async function addLabelPointsBatch({ records }) {
  const sqlArr = records.map(item => {
    const {
      id,
      prid,
      name,
      problem,
      proposal,
      mdid,
      memo,
      cpid,
      ctime,
      dpid,
      dtime,
      otime,
      geometry,
    } = item;
    return [
      `insert into labelPoint (ID,PRID,NAME,PROBLEM,PROPOSAL,MDID,MEMO,CPID,CTIME,DPID,DTIME,OTIME,SHAPE,_v)
        values (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, prid, name, problem, proposal, mdid, memo, cpid, ctime, dpid, dtime, otime, geometry, 1],
    ];
  });

  return new Promise((resolve, reject) => {
    db.sqlBatch(
      sqlArr,
      () => {
        resolve();
      },
      error => {
        console.log(`批量插入标注点数据出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

//-----------------------------------------------------------------------------------------------------
// 根据ID查询照片点
export async function queryPhotoPointById({ id }) {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT * FROM photoPointView  where ID=?`,
      [id],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`根据ID查询照片点出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 根据名称查询照片点列表
export async function queryPhotoPointsByName({ name }) {
  let where = '';
  if (typeof name === 'string' && name.trim() !== '') {
    where = `where NAME like '%${name.trim()}%'`;
  } else {
    return [];
  }

  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT ID,NAME FROM photoPointView  ${where} order by trim(NAME) limit 20`,
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`根据名称查询照片点列表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询照片点列表
export async function queryPhotoPoints(params = {}) {
  const { limit = 10, returnGeometry = false } = params;
  let { where } = params;
  if ((typeof where === 'string' && where.trim() === '') || where == null) {
    where = '1=1';
  }

  let geometryField = '';
  if (returnGeometry) {
    geometryField = ', SHAPE as SHAPE ';
  }

  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT ID,NAME,AZIMUTH ${geometryField} FROM photoPointView where ${where} order by OTIME desc limit ?`,
      [limit],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询照片点列表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询新增的照片点
export async function queryAddPhotoPoints() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `select * from photoPoint where _v=2`,
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询新增的照片点出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询更新过的照片点
export async function queryUpdatePhotoPoints() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `select * from photoPoint where ID in (select ID from photoPoint where _v=3) order by ID, _v`,
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询更新过的照片点出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询删除的照片点
export async function queryDeletePhotoPoints() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `select ID,DPID,DTIME from photoPoint where _v=4`,
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询删除的照片点出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询照片点数量
export async function queryPhotoPointsCount(params = {}) {
  let { where } = params;
  if ((typeof where === 'string' && where.trim() === '') || where == null) {
    where = '1=1';
  }

  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT count(*) AS mycount FROM photoPointView  where ${where}`,
      [],
      rs => {
        resolve(rs.rows.item(0).mycount);
      },
      error => {
        console.log(`查询照片点数量出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询照片点修改数量
export async function queryPhotoPointsModifyCounts() {
  const addPhotoPointsCount = await queryCount(
    `SELECT count(*) AS mycount FROM photoPoint where _v=2`,
    '查询照片点新增数量出错'
  );

  const updatePhotoPointsCount = await queryCount(
    `SELECT count(*) AS mycount FROM photoPoint where _v=3`,
    '查询照片点修改数量出错'
  );

  const deletePhotoPointsCount = await queryCount(
    `SELECT count(*) AS mycount FROM photoPoint where _v=4`,
    '查询照片点删除数量出错'
  );

  return {
    addPhotoPointsCount,
    updatePhotoPointsCount,
    deletePhotoPointsCount,
  };
}

// 查询现状库照片点编号
export async function queryPhotoPointIds() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `select ID from photoPointView order by ID`,
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询现状库照片点编号出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 添加照片点
export async function addPhotoPoint({ record }) {
  const count = await queryCount(
    `SELECT count(*) AS mycount FROM photoPointView  where trim(NAME)=trim('${record.NAME}')`,
    '查询照片点名称是否已存在出错'
  );

  return new Promise((resolve, reject) => {
    if (count > 0) {
      resolve({
        success: false,
        message: '该照片点名称已存在！',
      });
    } else {
      const {
        ID,
        PRID,
        NAME,
        PROBLEM,
        PROPOSAL,
        MDID,
        MEMO,
        CPID,
        CTIME,
        DPID,
        DTIME,
        OTIME,
        AZIMUTH,
        SHAPE,
      } = record;
      const sqlArr = [
        [
          `insert into photoPoint (ID,PRID,NAME,PROBLEM,PROPOSAL,MDID,MEMO,CPID,CTIME,DPID,DTIME,OTIME,AZIMUTH ,SHAPE,_v)
          values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            ID,
            PRID,
            NAME,
            PROBLEM,
            PROPOSAL,
            MDID,
            MEMO,
            CPID,
            CTIME,
            DPID,
            DTIME,
            OTIME,
            AZIMUTH,
            SHAPE,
            2,
          ],
        ],
      ];

      db.sqlBatch(
        sqlArr,
        () => {
          resolve({
            success: true,
          });
        },
        error => {
          console.log(`插入照片点数据出错: ${error.message}`);
          reject(error.message);
        }
      );
    }
  });
}

// 修改照片点
export async function updatePhotoPoint({ record }) {
  const count = await queryCount(
    `SELECT count(*) AS mycount FROM photoPointView  where trim(NAME)=trim('${
      record.NAME
    }') and ID <> '${record.ID}'`,
    '查询照片点名称是否已存在出错'
  );

  return new Promise((resolve, reject) => {
    if (count > 0) {
      resolve({
        success: false,
        message: '该照片点名称已存在！',
      });
    } else {
      const { ID, _v, ...rest } = record;
      const sqlArr = [];

      // 未修改过，则生成插入语句
      if (_v === 1) {
        sqlArr.push([
          `insert into photoPoint(ID,PRID,NAME,PROBLEM,PROPOSAL,MDID,MEMO,CPID,CTIME,DPID,DTIME,OTIME,AZIMUTH ,SHAPE,_v) select ID,PRID,NAME,PROBLEM,PROPOSAL,MDID,MEMO,CPID,CTIME,DPID,DTIME,OTIME,AZIMUTH ,SHAPE,3 from photoPoint where ID=?`,
          [ID],
        ]);
      }

      // 生成更新语句
      const items = [];
      const values = [];
      for (const key in rest) {
        if ({}.hasOwnProperty.call(record, key)) {
          items.push(`${key}=?`);
          values.push(record[key]);
        }
      }
      values.push(ID);
      sqlArr.push([
        `update photoPoint set ${items.join(',')} where (_v=2 or _v=3) and ID=?`,
        values,
      ]);

      db.sqlBatch(
        sqlArr,
        () => {
          resolve({
            success: true,
          });
        },
        error => {
          console.log(`修改照片点出错: ${error.message}`);
          reject(error.message);
        }
      );
    }
  });
}

// 根据关联ID删除照片点
export async function deletePhotoPointById({ ID, DPID, DTIME }) {
  const removeSqls = [
    `delete FROM photoPoint where ID = '${ID}' and (_v=2 or _v=3)`,
    [`update photoPoint set _v=4,DPID=?,DTIME=? where ID = '${ID}' and _v=1`, [DPID, DTIME]],
  ];
  await sqlBatch(removeSqls, '根据关联ID删除照片点出错');
}

// 清空照片点表
export async function emptyPhotoPoints() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `delete from photoPoint`,
      [],
      () => {
        resolve();
      },
      error => {
        console.log(`清空照片点表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 批量添加照片点
export async function addPhotoPointsBatch({ records }) {
  const sqlArr = records.map(item => {
    const {
      ID,
      PRID,
      NAME,
      PROBLEM,
      PROPOSAL,
      MDID,
      MEMO,
      CPID,
      CTIME,
      DPID,
      DTIME,
      OTIME,
      AZIMUTH,
    } = item.attributes;
    const geo = item.geometry;
    return [
      `insert into photoPoint (ID,PRID,NAME,PROBLEM,PROPOSAL,MDID,MEMO,CPID,CTIME,DPID,DTIME,OTIME,AZIMUTH ,SHAPE,_v)
        values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        ID,
        PRID,
        NAME,
        PROBLEM,
        PROPOSAL,
        MDID,
        MEMO,
        CPID,
        CTIME,
        DPID,
        DTIME,
        OTIME,
        AZIMUTH,
        geo ? JSON.stringify(geo) : null,
        1,
      ],
    ];
  });

  return new Promise((resolve, reject) => {
    db.sqlBatch(
      sqlArr,
      () => {
        resolve();
      },
      error => {
        console.log(`批量插入照片点数据出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

//-----------------------------------------------------------------------------------------------------
// 根据ID查询建设单位
export async function queryCsUnitById({ id }) {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT * FROM csUnitView where ID=?`,
      [id],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`根据ID查询建设单位出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// DbSearchPicker根据ID查询建设单位
export async function queryDBCsUnitById({ id }) {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT * FROM csUnitView where ID=?`,
      [id],
      rs => {
        const data = toModels(rs.rows);
        data.unshift({ ID: '', DP_NAME: '请选择' });
        resolve(data);
      },
      error => {
        console.log(`根据ID查询建设单位出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 根据名称查询建设单位列表
export async function queryCsUnitsByName({ name }) {
  let where = '';
  if (typeof name === 'string' && name.trim() !== '') {
    where = `where DP_NAME like '%${name.trim()}%'`;
  } else {
    return [];
  }

  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT ID,DP_NAME FROM csUnitView ${where} order by trim(DP_NAME) limit 20`,
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`根据名称查询建设单位列表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// DbSearchPicker根据名称查询建设单位列表
export async function queryDBCsUnitsByName({ name }) {
  let where = '';
  if (typeof name === 'string' && name.trim() !== '') {
    where = `where DP_NAME like '%${name.trim()}%'`;
  } else {
    return [];
  }

  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT ID,DP_NAME FROM csUnitView ${where} order by trim(DP_NAME) limit 20`,
      [],
      rs => {
        const data = toModels(rs.rows);
        data.unshift({ ID: '', DP_NAME: '请选择' });
        resolve(data);
      },
      error => {
        console.log(`根据名称查询建设单位列表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询建设单位列表
export async function queryCsUnits(params = {}) {
  const { limit = 10 } = params;
  let { where } = params;
  if ((typeof where === 'string' && where.trim() === '') || where == null) {
    where = '1=1';
  }

  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT ID,DP_NAME,COALESCE(M_TIME,C_TIME) as OTIME FROM csUnitView where ${where} order by COALESCE(M_TIME,C_TIME) desc limit ?`,
      [limit],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询建设单位列表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询新增的建设单位
export async function queryAddCsUnits() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `select * from csUnit where _v=2`,
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询新增的建设单位出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询更新过的建设单位
export async function queryUpdateCsUnits() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `select * from csUnit where ID in (select ID from csUnit where _v=3) order by ID, _v`,
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询更新过的建设单位出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询建设单位数量
export async function queryCsUnitsCount(params = {}) {
  let { where } = params;
  if ((typeof where === 'string' && where.trim() === '') || where == null) {
    where = '1=1';
  }

  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT count(*) AS mycount FROM csUnitView where ${where}`,
      [],
      rs => {
        resolve(rs.rows.item(0).mycount);
      },
      error => {
        console.log(`查询建设单位数量出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询建设单位修改数量
export async function queryCsUnitsModifyCounts() {
  const addCsUnitsCount = await queryCount(
    `SELECT count(*) AS mycount FROM csUnit where _v=2`,
    '查询建设单位新增数量出错'
  );

  const updateCsUnitsCount = await queryCount(
    `SELECT count(*) AS mycount FROM csUnit where _v=3`,
    '查询建设单位修改数量出错'
  );

  const deleteCsUnitsCount = await queryCount(
    `SELECT count(*) AS mycount FROM csUnit where _v=4`,
    '查询建设单位删除数量出错'
  );

  return {
    addCsUnitsCount,
    updateCsUnitsCount,
    deleteCsUnitsCount,
  };
}

// 添加建设单位
export async function addCsUnit({ record }) {
  const count = await queryCount(
    `SELECT count(*) AS mycount FROM csUnitView where trim(DP_NAME)=trim('${record.DP_NAME}')`,
    '查询建设单位名称是否已存在出错'
  );

  return new Promise((resolve, reject) => {
    if (count > 0) {
      resolve({
        success: false,
        message: '该建设单位名称已存在！',
      });
    } else {
      const { ID, DP_NAME, DESCRIPTION, C_PERSON, C_TIME, M_PERSON, M_TIME } = record;
      const sqlArr = [
        [
          `insert into csUnit (ID,DP_NAME,DESCRIPTION,C_PERSON,C_TIME,M_PERSON,M_TIME,_v)
          values (?,?,?,?,?,?,?,?)`,
          [ID, DP_NAME, DESCRIPTION, C_PERSON, C_TIME, M_PERSON, M_TIME, 2],
        ],
      ];

      db.sqlBatch(
        sqlArr,
        () => {
          resolve({
            success: true,
          });
        },
        error => {
          console.log(`插入建设单位数据出错: ${error.message}`);
          reject(error.message);
        }
      );
    }
  });
}

// 修改建设单位
export async function updateCsUnit({ record }) {
  const count = await queryCount(
    `SELECT count(*) AS mycount FROM csUnitView where trim(DP_NAME)=trim('${
      record.DP_NAME
    }') and ID <> '${record.ID}'`,
    '查询建设单位名称是否已存在出错'
  );

  return new Promise((resolve, reject) => {
    if (count > 0) {
      resolve({
        success: false,
        message: '该建设单位名称已存在！',
      });
    } else {
      const { ID, _v, ...rest } = record;
      const sqlArr = [];

      // 未修改过，则生成插入语句
      if (_v === 1) {
        sqlArr.push([
          `insert into csUnit(ID,DP_NAME,DESCRIPTION,C_PERSON,C_TIME,M_PERSON,M_TIME,_v) select ID,DP_NAME,DESCRIPTION,C_PERSON,C_TIME,M_PERSON,M_TIME,3 from csUnit where ID=?`,
          [ID],
        ]);
      }

      // 生成更新语句
      const items = [];
      const values = [];
      for (const key in rest) {
        if ({}.hasOwnProperty.call(record, key)) {
          items.push(`${key}=?`);
          values.push(record[key]);
        }
      }
      values.push(ID);
      sqlArr.push([`update csUnit set ${items.join(',')} where (_v=2 or _v=3) and ID=?`, values]);

      db.sqlBatch(
        sqlArr,
        () => {
          resolve({
            success: true,
          });
        },
        error => {
          console.log(`修改建设单位出错: ${error.message}`);
          reject(error.message);
        }
      );
    }
  });
}

// 清空建设单位表
export async function emptyCsUnits() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `delete from csUnit`,
      [],
      () => {
        resolve();
      },
      error => {
        console.log(`清空建设单位表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 批量添加建设单位
export async function addCsUnitsBatch({ records }) {
  const sqlArr = records.map(item => {
    return [
      `insert into csUnit (ID,DP_NAME,DESCRIPTION,C_PERSON,C_TIME,M_PERSON,M_TIME,_v)
        values (?,?,?,?,?,?,?,?)`,
      [
        // String(item.ID),
        item.ID,
        item.DP_NAME,
        item.DESCRIPTION,
        item.C_PERSON,
        item.C_TIME,
        item.M_PERSON,
        item.M_TIME,
        1,
      ],
    ];
  });

  return new Promise((resolve, reject) => {
    db.sqlBatch(
      sqlArr,
      () => {
        resolve();
      },
      error => {
        console.log(`批量插入建设单位数据出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

//-----------------------------------------------------------------------------------------------------
// 根据关联ID查询附件
export async function queryAttachmentsByRelationId({ id }) {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT * FROM attachmentView where RELATION_ID=?`,
      [id],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`根据关联ID查询附件出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询新增的附件
export async function queryAddAttachments() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `select * from attachment where _v=2`,
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询新增的附件出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询单个图斑新增的附件
export async function queryAddAttachmentsById(id) {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `select * from attachment where _v=2 and RELATION_ID = ?`,
      [id],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询新增的附件出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询更新过的附件
export async function queryUpdateAttachments() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `select * from attachment where ID in (select ID from attachment where _v=3) order by ID, _v`,
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询更新过的附件出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询删除的附件
export async function queryDeleteAttachments() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `select * from attachment where _v=4`,
      [],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询删除的附件出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询单个图斑删除的附件
export async function queryDeleteAttachmentsById(id) {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `select * from attachment where _v=4 and RELATION_ID = ?`,
      [id],
      rs => {
        resolve(toModels(rs.rows));
      },
      error => {
        console.log(`查询删除的附件出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询附件数量
export async function queryAttachmentsCount(params = {}) {
  let { where } = params;
  if ((typeof where === 'string' && where.trim() === '') || where == null) {
    where = '1=1';
  }

  return new Promise((resolve, reject) => {
    db.executeSql(
      `SELECT count(*) AS mycount FROM attachmentView where ${where}`,
      [],
      rs => {
        resolve(rs.rows.item(0).mycount);
      },
      error => {
        console.log(`查询附件数量出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 查询附件修改数量
export async function queryAttachmentsModifyCounts(params = {}) {
  let { where } = params;
  if ((typeof where === 'string' && where.trim() === '') || where == null) {
    //
  } else {
    where = ` and ${where}`;
  }

  const addAttachmentsCount = await queryCount(
    `SELECT count(*) AS mycount FROM attachment where _v=2 ${where}`,
    '查询附件新增数量出错'
  );

  const updateAttachmentsCount = await queryCount(
    `SELECT count(*) AS mycount FROM attachment where _v=3 ${where}`,
    '查询附件修改数量出错'
  );

  const deleteAttachmentsCount = await queryCount(
    `SELECT count(*) AS mycount FROM attachment where _v=4 ${where}`,
    '查询附件删除数量出错'
  );

  return {
    addAttachmentsCount,
    updateAttachmentsCount,
    deleteAttachmentsCount,
  };
}

// 批量编辑（新增、修改、移除）附件
export async function editAttachments({ records, RELATION_ID }) {
  console.log('批量编辑（新增、修改、移除）附件', records, RELATION_ID);
  if (records.length > 0) {
    // 新增的SQL语句
    const addSqls = records.map(item => [
      `insert into attachment(ID,RELATION_ID,TYPE,PATH,USER_ID,USER_NAME,SOURCE,LONGITUDE,LATITUDE,AZIMUTH,C_TIME,_v) select ?,?,?,?,?,?,?,?,?,?,?,? where not exists(select ID from attachment where ID='${
        item.ID
      }' and RELATION_ID = '${item.RELATION_ID}')`,
      [
        item.ID,
        item.RELATION_ID,
        item.TYPE,
        item.PATH,
        item.USER_ID,
        item.USER_NAME,
        item.SOURCE,
        item.LONGITUDE,
        item.LATITUDE,
        item.AZIMUTH,
        item.C_TIME,
        2,
      ],
    ]);

    // 更新的SQL语句（isEdit为true）
    let idsStr = records
      .filter(item => item.isEdit)
      .map(item => `'${item.ID}'`)
      .join(',');
    const updateSql = `insert into attachment(ID,RELATION_ID,TYPE,PATH,USER_ID,USER_NAME,SOURCE,LONGITUDE,LATITUDE,AZIMUTH,C_TIME,_v) select ID,RELATION_ID,TYPE,PATH,USER_ID,USER_NAME,SOURCE,LONGITUDE,LATITUDE,AZIMUTH,C_TIME,3 from attachment where ID in (${idsStr}) and RELATION_ID = '${RELATION_ID}' group by RELATION_ID,ID having count(*)=1 and _v=1`;

    // 移除的SQL语句
    idsStr = records.map(item => `'${item.ID}'`).join(',');
    console.log('idsStr', idsStr);
    const removeSqls = [
      `delete FROM attachment where ID not in (${idsStr}) and RELATION_ID = '${RELATION_ID}' and (_v=2 or _v=3)`,
      `update attachment set _v=4 where ID not in (${idsStr}) and RELATION_ID = '${RELATION_ID}' and _v=1`,
    ];

    await sqlBatch([...addSqls, updateSql, ...removeSqls], '新增/更新/移除照片出错');
  } else {
    const removeSqls = [
      `delete FROM attachment where RELATION_ID = '${RELATION_ID}' and (_v=2 or _v=3)`,
      `update attachment set _v=4 where RELATION_ID = '${RELATION_ID}' and _v=1`,
    ];
    await sqlBatch([...removeSqls], '移除最后一张照片出错');
  }
}

// 根据关联ID删除附件
export async function deleteAttachmentsByRelationId({ ID }) {
  const removeSqls = [
    `delete FROM attachment where  RELATION_ID = '${ID}' and (_v=2 or _v=3)`,
    `update attachment set _v=4 where RELATION_ID = '${ID}' and _v=1`,
  ];
  await sqlBatch(removeSqls, '根据关联ID删除附件出错');
}

// 清空附件表
export async function emptyAttachments() {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `delete from attachment`,
      [],
      () => {
        resolve();
      },
      error => {
        console.log(`清空附件表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 清空单个图斑的相关附件
export async function emptySpotAttachmentsById(id) {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `delete from attachment where RELATION_ID = ?`,
      [id],
      () => {
        resolve();
      },
      error => {
        console.log(`清空附件表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 批量添加附件
export async function addAttachmentsBatch({ records }) {
  console.log('批量添加附件', records);
  const sqlArr = records.map(item => {
    return [
      `insert into attachment (ID,RELATION_ID,TYPE,PATH,USER_ID,USER_NAME,SOURCE,LONGITUDE,LATITUDE,AZIMUTH,C_TIME,_v)
        values (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        item.ID,
        item.RELATION_ID,
        item.TYPE,
        item.PATH,
        item.USER_ID,
        item.USER_NAME,
        item.SOURCE,
        item.LONGITUDE,
        item.LATITUDE,
        item.AZIMUTH,
        item.C_TIME,
        1,
      ],
    ];
  });

  return new Promise((resolve, reject) => {
    db.sqlBatch(
      sqlArr,
      () => {
        resolve();
      },
      error => {
        console.log(`批量插入附件数据出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 移除附件
export async function deleteAttachments({ ids }) {
  const idStr = ids.map(id => `'${id}'`).join(',');
  const sqlArr = [`delete from attachment where ID in (${idStr})`];

  return new Promise((resolve, reject) => {
    db.sqlBatch(
      sqlArr,
      () => {
        resolve();
      },
      error => {
        console.log(`移除附件数据出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 清理新增或编辑的附件记录
export async function revertAddOrUpdateAttachments({ id }) {
  const sqlArr = [
    [`delete from attachment where _v=1 and ID=?`, [id]],
    [`update attachment set _v=1 where (_v=2 or _v=3) and ID=?`, [id]],
  ];

  return new Promise((resolve, reject) => {
    db.sqlBatch(
      sqlArr,
      () => {
        resolve();
      },
      error => {
        console.log(`清理新增或编辑的附件记录: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

//测试矢量瓦片数据
export async function queryVectorGrid(params = {}) {
  let { geojsonUrl } = params;
  return request(geojsonUrl, {
    method: 'GET',
    dataType: 'json',
    headers: {},
  });
}
