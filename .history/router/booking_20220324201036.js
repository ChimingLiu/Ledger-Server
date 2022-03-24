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
      'SELECT accountName,inoutType,balance,inoutTime,typeName,iconName, `index` FROM userinout m LEFT JOIN inouttype l on m.typeID = l.typeID WHERE id=? ' +
      'ORDER BY inoutTime DESC LIMIT ?,?;',
    params: [req.query.id,req.query.length-0, req.query.length-0+20],
    success: (result) => {
      res.send({ status: true, data: result });
    },

    error: (err) => {
      console.log(err);
    },
  });

});



module.exports = router;