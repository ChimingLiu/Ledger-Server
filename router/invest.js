// 记账相关
const express = require('express');
const router = express.Router();
// toeken 设置
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
// 引入数据库连接
const handler = require('../database.js');
function getUuiD(randomLength){
  return Number(Math.random().toString().substr(2,randomLength) + Date.now()).toString(36)
}

// 请求获取基金代码
router.get('/getFundCode', (req, res) => {
  handler.exec({
    sql: 'SELECT name,code FROM investlist WHERE code LIKE ? AND type=\'fund\' LIMIT 6',
    params: [req.query.code + '%'],
    success: (result) => {
      res.send({ status: true, data: result });
    },

    error: (err) => {
      console.log(err);
    },
  });
});
// 向后台提交基金投资信息
router.post('/postFundData', (req, res) => {
  if (req.body.__proto__ === undefined)
    Object.setPrototypeOf(req.body, new Object());
  let user = JSON.parse(Object.keys(req.body));
  handler.exec({
    sql: 'INSERT INTO invest (id,accountID,share,buyPrice,buyTime,code,investType,`index`) VALUES (?,?,?,?,?,?,?,?);',
    params: [
      user.id,
      user.accountID,
      user.share,
      user.buyPrice,
      new Date(user.buyTime),
      user.code,
      user.type,
      getUuiD(10),
    ],
    success: (result) => {
      console.log(user);
      res.send({ status: true });
    },
    error: (err) => {
      res.send({ msg: error });
    },
  });
});
// 获取用户投资基金信息
router.get('/getFundInvest', (req, res) => {
  handler.exec({
    sql: `SELECT invest.code,invest.buyTime,invest.buyPrice,\`index\`,
    investlist.prePrice,SUM(invest.share) as share,invest.accountID,investlist.name,investlist.currentPrice FROM invest 
    LEFT JOIN investlist 
    on invest.code = investlist.code AND invest.investType = investlist.type
    WHERE id=? AND invest.investType ='fund'
    GROUP BY invest.buyTime,invest.code
    ORDER BY invest.buyTime DESC`,
    params: [req.query.id],
    success: (result) => {
      const map = new Map();
      for (let i = 0; i < result.length; i += 1) {
        if (map.has(result[i].name)) {
          map.get(result[i].name).push(result[i]);
        } else {
          map.set(result[i].name, [result[i]]);
        }
      }
      for([k,v] of map.entries()) {
        let temp = [0, 0, 0];
        for(let i=0;i<v.length;i++) {
          temp[0] += v[i].share;
          temp[1] += (v[i].share * v[i].buyPrice);
        }
        temp[2] = (temp[0] * v[0].currentPrice);
        temp[3] = (temp[2] - temp[1]);
        map.get(k).unshift(temp);
      }
      res.send({data: [...map]});
    },

    error: (err) => {
      console.log(err);
      res.send({ status: false, error: err });
    },
  });
});

// 请求获取股票代码
router.get('/getStockCode', (req, res) => {
  handler.exec({
    sql: 'SELECT name,code FROM investlist WHERE code LIKE ? AND type=\'stock\' LIMIT 6',
    params: [req.query.code + '%'],
    success: (result) => {
      res.send({ status: true, data: result });
    },

    error: (err) => {
      console.log(err);
    },
  });
});

// 获取用户投资股票信息
router.get('/getStockInvest', (req, res) => {
  handler.exec({
    sql: `SELECT investlist.code,invest.buyTime,invest.buyPrice,\`index\`,
    SUM(invest.share) as share,invest.accountID,investlist.\`name\`
    FROM invest LEFT JOIN investlist 
    on invest.code = investlist.code AND invest.investType = investlist.type
    WHERE id=? AND invest.investType ='stock'
    GROUP BY invest.buyTime,invest.code`,
    params: [req.query.id],
    success: (result) => {
      const map = new Map();
      for (let i = 0; i < result.length; i += 1) {
        if (map.has(result[i].name)) {
          map.get(result[i].name).push(result[i]);
        } else {
          map.set(result[i].name, [result[i]]);
        }
      }
      for([k,v] of map.entries()) {
        let temp = [0, 0, 0];
        for(let i=0;i<v.length;i++) {
          temp[0] += v[i].share;
          temp[1] += (v[i].share * v[i].buyPrice);
        }
        temp[2] = (temp[0] * v[0].currentPrice);
        temp[3] = (temp[2] - temp[1]);
        map.get(k).unshift(temp);
      }
      res.send({data: [...map]});
    },

    error: (err) => {
      console.log(err);
      res.send({ status: false, error: err });
    },
  });
});

// 获取用户所有投资信息
router.get('/getAllInvest', (req, res) => {
  handler.exec({
    sql: `SELECT \`code\`,buyTime, buyPrice,\`share\`,investType,accountName,accountType,invest.accountID
    FROM invest
    LEFT JOIN useraccount
    ON useraccount.accountID = invest.accountID AND useraccount.id = invest.id
    WHERE invest.id = ?`,
    params: [req.query.id],
    success: (result) => {
      res.send({data: result});
    },

    error: (err) => {
      console.log(err);
      res.send({ status: false, error: err });
    },
  });
});

// 导入用户的投资数据
router.post('/importInvestData', async (req, res) => {
  if (req.body.__proto__ === undefined)
    Object.setPrototypeOf(req.body, new Object());
  let data = JSON.parse(Object.keys(req.body));
  const id = data.id;
  data = data.data;
  let map = {};
  for(let item of data) {
    if(!map[item[1]]) {
      map[item[1]] = {
        name: item[1],
        type: item[7],
      }
    }
  }
  for(let item of Object.values(map)) {
    await exitAccount(item.name, item.type, id).then(res => {
      map[item.name].code = res
    });
  }
  for(let item of data) {
    handler.exec({
      sql: `INSERT INTO invest 
      (id,accountID,share,buyPrice,buyTime,code,investType,\`index\`) 
      VALUES (?,?,?,?,?,?,?,?);`,
      params: [
        id,
        map[item[1]].code,
        Number(item[4]),
        parseFloat(item[5]),
        new Date(item[0]),
        item[2],
        item[3],
        getUuiD(10),
      ],
      success: (r) => {
        
      },
      error: (err) => {
        res.send({ msg: error });
      },
    });
  }
  res.send({status: true});
});

async function exitAccount(name, type, id) {
  return new Promise((resolve, rejcet) => {
    let code = 0;
    handler.exec({
      sql: `SELECT accountID
      FROM useraccount
      WHERE id = ? AND accountName=? AND accountType=?`,
      params: [id, name, type],
      success: async (result) => {
        if (result.length > 0) {
          code =  result[0].accountID;
          resolve(code)
        }else createAccount(name, id, type);
      }
    })
  })
}

async function createAccount(name, id, type) {
  return new Promise((resolve, reject) => {
    let accountID = getUuiD();
    handler.exec({
      sql:
        'INSERT INTO useraccount (id, accountType, accountBalance, accountName,accountRemark, accountID) VALUES (?,?,?,?,?, ?);',
      params: [
        id,
        type,
        0,
        name,
        '',
        accountID,
      ],
      success: () => {
        resolve(accountID)
      },
      error: (err) => {
        res.send({ msg: error });
      },
    });
  })
}


module.exports = router;
