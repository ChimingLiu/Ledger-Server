// 记账相关
const express = require('express');
const router = express.Router();
// toeken 设置
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
// 引入数据库连接
const handler = require('../database.js');
const updateCoin = require('../updateCoin.js');


// 获取用户总余额
router.get('/accountTotalBalance', (req, res) => {
    handler.exec({
      sql: 'SELECT SUM(accountBalance) FROM useraccount WHERE id = ?;',
      params: [req.query.id],
      success: (result) => {
  
        res.send({ data: result });
      },
      error: (err) => {
        console.log(err);
      },
    });
  })


// 获取支出类型
router.get('/outFlowType', (req, res) => {
  handler.exec({
    sql: 'SELECT * FROM outflowtype;',
    success: (result) => {
      res.send({ status: true, data: result });
    },

    error: (err) => {
      console.log(err);
      res.send(err);
    },
  });
});
// 获取收入类型
router.get('/inFlowType', (req, res) => {
  handler.exec({
    sql: 'SELECT * FROM inflowtype;',
    success: (result) => {
      res.send({ status: true, data: result });
    },

    error: (err) => {
      console.log(err);
      res.send(err);
    },
  });
});


// 获取用户账本收入支出信息
router.get('/getInOutInfo', (req, res) => {
  handler.exec({
    sql:
    `SELECT r.accountID, r.accountName as accountName,inoutType,balance,inoutTime,typeName,iconName, \`index\`,comment 
    FROM userinout m
    LEFT JOIN inouttype l
    on m.typeID = l.typeID 
    LEFT JOIN useraccount r
    on m.accountID = r.accountID
    WHERE m.id= ?
    ORDER BY inoutTime DESC LIMIT ?,?;`,
    params: [req.query.id,req.query.length-0, req.query.length-0+20],
    success: (result) => {
      res.send({ status: true, data: result });
    },

    error: (err) => {
      console.log(err);
    },
  });

});

// 向后台提交记账支出数据
router.post('/outFlowCommit', (req, res) => {
  // 获取用户发送请求
  if (req.body.__proto__ === undefined)
    Object.setPrototypeOf(req.body, new Object());
  let outForm = JSON.parse(Object.keys(req.body));
  Promise.all([
    new Promise((resolve, reject) => {
      console.log(outForm);
      handler.exec({
        sql:
          'INSERT INTO userinout (id, accountID, inoutType, balance, inoutTime, typeID, comment) VALUES (?,?,?,?,?,?,?);',
        params: [
          outForm.id,
          outForm.accountID,
          'out',
          outForm.num,
          new Date(outForm.date),
          outForm.typeID,
          outForm.comment,
        ],
        success: (result) => {
          resolve(result)
        },
        error: (err) => {
          reject(err)
        },
      })
    }),
    new Promise((resolve, reject) => {
      handler.exec({
        sql:
          'UPDATE useraccount SET accountBalance=accountBalance-? WHERE id=? AND accountID=?;',
        params: [
          outForm.num,
          outForm.id,
          outForm.accountID,
        ],
        success: (result) => {
          resolve(result)
        },
        error: (err) => {
          reject(err)
        },
      })
    })
  ]).then((result) => {
    res.send(result)
  })
  ;
});

// 向后台提交记账收入数据
router.post('/inFlowCommit', (req, res) => {
  // 获取用户发送请求
  if (req.body.__proto__ === undefined)
    Object.setPrototypeOf(req.body, new Object());
  let outForm = JSON.parse(Object.keys(req.body));
  Promise.all([
    new Promise((resolve, reject) => {
      handler.exec({
        sql:
          'INSERT INTO userinout (id, accountID, inoutType, balance, inoutTime, typeID) VALUES (?,?,?,?,?,?);',
        params: [
          outForm.id,
          outForm.accountID,
          'in',
          outForm.num,
          new Date(outForm.date),
          outForm.typeID,
        ],
        success: (result) => {
          resolve(result)
          // res.send({ status: true });
        },
        error: (err) => {
          reject(err)
          // res.send({ msg: error });
        },
      });
    }),
    new Promise((resolve, reject) => {
      handler.exec({
        sql:
          'UPDATE useraccount SET accountBalance=accountBalance+? WHERE id=? AND accountID=?;',
        params: [
          outForm.num,
          outForm.id,
          outForm.accountID,
        ],
        success: (result) => {
          resolve(result)
        },
        error: (err) => {
          reject(err)
        },
      })
    }),
  ]).then((result) => {
    res.send({ status: true });
  })
  
});

// 删除后台指定记账记录
router.get('/deleteReccord', (req, res) => {
  handler.exec({
    sql:'DELETE FROM userinout WHERE id=? AND `index` = ?;',
    params: [req.query.id, req.query.index],
    success: (result) => {
      res.send({ status: true, data: result });
    },
    error: (err) => {
      console.log(err);
    },
  });
})

// 提交内部转账数据
router.post('/submitExchange', (req, res) => {
  if (req.body.__proto__ === undefined)
    Object.setPrototypeOf(req.body, new Object());
  let user = JSON.parse(Object.keys(req.body));
  res.send({ status: true });
});

module.exports = router;