// 创建共享表
// https://github.com/litehelpers/Cordova-sqlite-storage#readme
// https://www.sqlite.org/datatype3.html#section_3
// https://segmentfault.com/a/1190000003827034
// 字段类型：
// TEXT
// NUMERIC
// INTEGER
// REAL
// BLOB
export async function createShareTables(db) {
  return new Promise((resolve, reject) => {
    db.sqlBatch(
      [
        // 用户信息表：用户id，用户名，密码，真实姓名，单位id，单位名称，单位代码（省市县），分所代码，区域监管区域（流域机构），今年监管区域（流域机构，是否记住用户密码（0 不记住，1 记住） ，登陆时间
        `CREATE TABLE IF NOT EXISTS user (
        userId     TEXT,
        userName   TEXT,
        password   TEXT,
        trueName   TEXT,
        dwid       TEXT,
        dwmc       TEXT,
        dwdm       TEXT,
        fsdm       TEXT,
        regionArea TEXT,
        underArea  TEXT,
        isReserve  INTEGER,
        landTime   INTEGER
      )`,
        // 瓦片下载信息表：编号, 名称, 矩形区域, 创建时间, 是否已完成（0未完成、1完成）, 当前已下载的xyz, 进度，是否已暂停（0未暂停、1暂停）
        `CREATE TABLE IF NOT EXISTS tileDownloadInfo (
        id         text primary key,
        name       text,
        bbox       text,
        createTime text,
        isFinished integer,
        xyz        text,
        percent    integer,
        isPaused   integer
      )`,
        // 瓦片删除信息表：编号, 名称, 矩形区域, 删除时间, 当前已删除的xyz, 进度
        `CREATE TABLE IF NOT EXISTS tileDeleteInfo (
        id         text primary key,
        name       text,
        bbox       text,
        deleteTime text,
        xyz        text,
        percent    integer
      )`,
        // 使用说明附件表：ID 附件编号，FILE_NAME 文件名，TYPE 类型，PATH 路径
        `CREATE TABLE IF NOT EXISTS instruction (
        ID          TEXT,
        FILE_NAME   TEXT,
        TYPE        TEXT,
        PATH        TEXT
      )`,
      ],
      () => {
        resolve();
      },
      error => {
        console.log(`批量创建共享表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}

// 创建用户表
export async function createUserTables(db) {
  return new Promise((resolve, reject) => {
    db.sqlBatch(
      [
        // 图斑：ID ID，TBID 图斑ID，QDNM 图斑编号，PRID 项目名称，QTYPE 扰动图斑类型，QAREA 扰动面积，EAREA 扰动超出面积，QDCS 建设状态，QDTYPE 扰动变化类型，BYD 扰动合规性，SEROSION 土壤侵蚀强度，ISFOCUS 是否重点监管任务，ISREVIEW 是否现场复核，ADDRESS 详细地址，PROBLEM 问题，PROPOSAL 建议，STATE 成果审核状态，MEMO 备注，CPID 创建人员，CTIME 创建时间，DPID 消亡人员，DTIME 消亡时间，BPID 关联绑定操作人名，BDID 关联绑定操作单位，OTIME 操作时间，XZQDM 涉及县行政区划代码，SHAPE 图形，_v 版本
        `CREATE TABLE IF NOT EXISTS spot (
        ID       TEXT,
        TBID     TEXT,
        QDNM     TEXT,
        PRID     TEXT,
        QTYPE    TEXT,
        QAREA    REAL,
        EAREA    REAL,
        QDCS     TEXT,
        QDTYPE   TEXT,
        BYD      TEXT,
        SEROSION TEXT,
        ISFOCUS  TEXT,
        ISREVIEW TEXT,
        ADDRESS  TEXT,
        PROBLEM  TEXT,
        PROPOSAL TEXT,
        STATE    TEXT,
        MEMO     TEXT,
        CPID     TEXT,
        CTIME    INTEGER,
        DPID     TEXT,
        DTIME    INTEGER,
        BPID     TEXT,
        BDID     TEXT,
        OTIME    INTEGER,
        XZQDM    TEXT,
        SHAPE    TEXT,
        _v       INTEGER
      )`,
        // 项目：SWC_P_ID 项目ID，VEC_TYPE 矢量化类型，PRO_NAME 项目名称，XMHGX 项目合规性，CS_UNIT_ID 建设单位ID，RP_AGNT_ID 批复机构ID，PRO_LEVEL 立项级别，RP_NUM 批复文号，RP_TIME	批复时间，PRO_TYPE 项目类型，PRO_CATE 项目类别，PRO_NAT 项目性质，CST_STATE 建设状态，IPT_UNIT 录入单位ID，SUP_UNIT 监管单位ID，IVV_CNTY 涉及县（市、区），C_PERSON 创建人员，C_TIME 创建时间，M_PERSON 修改人员，M_TIME 修改时间，DATA_STATE 数据状态，MDID 上图单位ID，MEMO 备注，SHAPE 图形，_v 版本
        `CREATE TABLE IF NOT EXISTS project (
          SWC_P_ID    TEXT,
          VEC_TYPE    TEXT,
          PRO_NAME    TEXT,
          XMHGX       TEXT,
          CS_UNIT_ID  TEXT,
          RP_AGNT_ID  TEXT,
          PRO_LEVEL   TEXT,
          RP_NUM      TEXT,
          RP_TIME     INTEGER,
          PRO_TYPE    TEXT,
          PRO_CATE    TEXT,
          PRO_NAT     TEXT,
          CST_STATE   TEXT,
          IPT_UNIT    TEXT,
          SUP_UNIT    TEXT,
          IVV_CNTY    TEXT,
          C_PERSON    TEXT,
          C_TIME      INTEGER,
          M_PERSON    TEXT,
          M_TIME      INTEGER,
          DATA_STATE  TEXT,
          MDID	      TEXT,
          MEMO        TEXT,
          SHAPE       TEXT,
          _v          INTEGER
        )`,
        // 字典表：类型名称，键，值
        `CREATE TABLE IF NOT EXISTS dict (
          TypeName    TEXT,
          DictId    TEXT,
          DictValue  TEXT
        )`,
        // 行政区划表：编码，名称，父节点编码
        `CREATE TABLE IF NOT EXISTS adminArea (
          QT_CTN_CODE    TEXT,
          NA_CTN_NAME    TEXT,
          QT_PARENT_CODE TEXT
        )`,
        // 部门表：部门id，部门名称，是否为批复单位，单位类型，单位代码，父节点id，行政区代码，部门描述
        `CREATE TABLE IF NOT EXISTS dept (
          DP_ID          TEXT,
          DP_NAME        TEXT,
          DP_PF          INTEGER,
          DP_TYPE        TEXT,
          DWDM           TEXT,
          PARENT_ID      TEXT,
          XZQDM          TEXT,
          DP_DESCRIPTION TEXT
        )`,
        // 建设单位表：id，单位名称，创建人，创建时间，修改人，修改时间，_v 版本
        `CREATE TABLE IF NOT EXISTS csUnit (
          ID          TEXT,
          DP_NAME     TEXT,
          DESCRIPTION TEXT,
          C_PERSON    TEXT,
          C_TIME      INTEGER,
          M_PERSON    TEXT,
          M_TIME      INTEGER,
          _v          INTEGER
        )`,
        // 附件表：ID 编号，RELATION_ID 关联编号，TYPE 类型，PATH 路径，USER_ID 用户编号，USER_NAME 用户名，SOURCE 来源（spot、labelPoint、photoPoint），LONGITUDE 经度 ，LATITUDE 纬度 ，AZIMUTH 方位角 ，C_TIME 创建时间 ，_v 版本
        `CREATE TABLE IF NOT EXISTS attachment (
          ID          TEXT,
          RELATION_ID TEXT,
          TYPE        TEXT,
          PATH        TEXT,
          USER_ID     TEXT,
          USER_NAME   TEXT,
          SOURCE      TEXT,
          LONGITUDE   TEXT,
          LATITUDE    TEXT,
          AZIMUTH     TEXT,
          C_TIME      REAL,
          _v          INTEGER
        )`,
        // 标注点：ID 编号，PRID 项目编号，NAME 名称，PROBLEM 问题，PROPOSAL 建议，MDID 上图单位ID，MEMO 备注，CPID 创建人员，CTIME 创建时间，DPID 消亡人员，DTIME 消亡时间，OTIME 操作时间，SHAPE 图形，_v 版本
        `CREATE TABLE IF NOT EXISTS labelPoint (
          ID               TEXT,
          PRID             TEXT,
          NAME             TEXT,
          PROBLEM          TEXT,
          PROPOSAL         TEXT,
          MDID             TEXT,
          MEMO             TEXT,
          CPID             TEXT,
          CTIME            INTEGER,
          DPID             TEXT,
          DTIME            INTEGER,
          OTIME            INTEGER,
          SHAPE            TEXT,
          _v               INTEGER
      )`,
        // 照片点：ID 编号，PRID 项目编号，NAME 名称，PROBLEM 问题，PROPOSAL 建议，MDID 上图单位ID，MEMO 备注，CPID 创建人员，CTIME 创建时间，DPID 消亡人员，DTIME 消亡时间，OTIME 操作时间，AZIMUTH 方位角，SHAPE 图形，_v 版本
        `CREATE TABLE IF NOT EXISTS photoPoint (
          ID               TEXT,
          PRID             TEXT,
          NAME             TEXT,
          PROBLEM          TEXT,
          PROPOSAL         TEXT,
          MDID             TEXT,
          MEMO             TEXT,
          CPID             TEXT,
          CTIME            INTEGER,
          DPID             TEXT,
          DTIME            INTEGER,
          OTIME            INTEGER,
          AZIMUTH          TEXT,
          SHAPE            TEXT,
          _v               INTEGER
      )`,

        // _v：1为同步下来的版本，2为新增，3为更新，4为删除
        // 图斑视图
        `create view IF NOT EXISTS spotView as select * from spot where (_v=1 and ID not in (select ID from spot where _v=3)) or _v=2 or _v=3`,

        // 项目视图
        `create view IF NOT EXISTS projectView as select * from project where (_v=1 and SWC_P_ID not in (select SWC_P_ID from project where _v=3)) or _v=2 or _v=3`,

        // 建设单位视图
        `create view IF NOT EXISTS csUnitView as select * from csUnit where (_v=1 and ID not in (select ID from csUnit where _v=3)) or _v=2 or _v=3`,

        // 标注点视图
        `create view IF NOT EXISTS labelPointView as select * from labelPoint where (_v=1 and ID not in (select ID from labelPoint where _v=3)) or _v=2 or _v=3`,

        // 照片点视图
        `create view IF NOT EXISTS photoPointView as select * from photoPoint where (_v=1 and ID not in (select ID from photoPoint where _v=3)) or _v=2 or _v=3`,

        // 附件视图
        `create view IF NOT EXISTS attachmentView as select * from attachment where (_v=1 and ID||RELATION_ID not in (select ID||RELATION_ID from attachment where _v=3)) or _v=2 or _v=3`,
      ],
      () => {
        resolve();
      },
      error => {
        console.log(`批量创建用户表出错: ${error.message}`);
        reject(error.message);
      }
    );
  });
}
