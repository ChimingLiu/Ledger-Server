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

module.exports = router;