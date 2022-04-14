// 记账相关
const express = require('express');
const router = express.Router();
// toeken 设置
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
// 引入数据库连接
const handler = require('../database.js');
const updateCoin = require('../updateCoin.js');



// 向后台提交虚拟货币交易记录
router.post('/postTradingData', (req, res) => {
  if (req.body.__proto__ === undefined)
    Object.setPrototypeOf(req.body, new Object());
  let user = JSON.parse(Object.keys(req.body));
  handler.exec({
    sql:
      'INSERT INTO investment (id,accountName,investType,totalPrice,buyPrice,buyTime,investName) VALUES (?,?,?,?,?,?,?);',
    params: [
      user.id,
      user.accountName,
      'coin',
      user.totalPrice,
      user.buyPrice,
      new Date(user.buyTime),
      user.name,
    ],
    success: (result) => {
      res.send({ status: true });
    },
    error: (err) => {
      res.send({ msg: error });
    },
  });
});
// 获取后台投资信息
router.get('/getInvestment',async (req, res) => {
  handler.exec({
    sql:'SELECT  a.index,a.accountName,a.buyPrice,a.buyTime,a.floating,a.investName,a.soldPrice,a.soldTime,a.totalPrice,b.currentUSDT '+
      'FROM investment a ,coindata b '+
      'WHERE a.id=? AND a.investName = b.symbol AND investType=?;',
    // sql: 'SELECT * FROM investment WHERE id=? AND investType=?;',
    params: [req.query.id, req.query.type],
    success: (result) => {
      res.send({ status: true, data: result });
    },

    error: (err) => {
      console.log(err);
    },
  });
});
// 后台获取支持的虚拟货币
router.get('/getCoinType', (req, res) =>{
  handler.exec({
    sql:'SELECT  symbol FROM coinData',
    success: (result) => {
      res.send({ status: true, data: result });
    },

    error: (err) => {
      console.log(err);
    },
  });
})
// 请求获取基金代码
router.get('/getFundCode', (req,res)=>{
  handler.exec({
    sql:'SELECT fundcode,name FROM fundlist WHERE fundcode LIKE ? LIMIT 6',
    params: [ req.query.code+'%' ],
    success: (result) => {
      res.send({ status: true, data: result });
    },

    error: (err) => {
      console.log(err);
    },
  });
})
// 向后台提交基金投资信息
router.post('/postFundData', (req, res) => {
  if (req.body.__proto__ === undefined)
    Object.setPrototypeOf(req.body, new Object());
  let user = JSON.parse(Object.keys(req.body));
  handler.exec({
    sql:
      'INSERT INTO fundinvest (id,accountName,share,buyPrice,buyTime,fundCode) VALUES (?,?,?,?,?,?);',
    params: [
      user.id,
      user.accountName,
      user.share,
      user.buyPrice,
      new Date(user.buyTime),
      user.code,
    ],
    success: (result) => {
      res.send({ status: true });
    },
    error: (err) => {
      res.send({ msg: error });
    },
  });
})
// 获取用户投资信息
router.get('/getFundInvest', (req,res) => {handler.exec({
  sql:`SELECT fundinvest.fundCode,fundinvest.buyTime,fundinvest.buyPrice,fundinvest.floating,fundinvest.share,fundinvest.accountName,fundlist.name,fundlist.currentPrice FROM fundinvest LEFT JOIN fundlist 
  on fundinvest.fundCode = fundlist.fundCode
  WHERE id=?`,
  params: [ req.query.id],
  success: (result) => {
    const map = new Map();
          for (let i = 0; i < res.data.length; i += 1) {
            if (map.has(res.data[i].name)) {
              map.get(res.data[i].name).push(res.data[i]);
            } else {
              map.set(res.data[i].name, [res.data[i]]);
            }
          }
          this.tableData = map.entries();
    res.send({ status: true, data: result });
  },

  error: (err) => {
    console.log(err);
    res.send({ status: false, error: err });
  },
});

})

module.exports = router;