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
    sql: 'INSERT INTO investment (id,accountName,investType,totalPrice,buyPrice,buyTime,investName) VALUES (?,?,?,?,?,?,?);',
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
router.get('/getInvestment', async (req, res) => {
  handler.exec({
    sql:
      'SELECT  a.index,a.accountName,a.buyPrice,a.buyTime,a.floating,a.investName,a.soldPrice,a.soldTime,a.totalPrice,b.currentUSDT ' +
      'FROM investment a ,coindata b ' +
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
router.get('/getCoinType', (req, res) => {
  handler.exec({
    sql: 'SELECT  symbol FROM coinData',
    success: (result) => {
      res.send({ status: true, data: result });
    },

    error: (err) => {
      console.log(err);
    },
  });
});
// 请求获取基金代码
router.get('/getFundCode', (req, res) => {
  handler.exec({
    sql: 'SELECT fundcode,name FROM fundlist WHERE fundcode LIKE ? LIMIT 6',
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
    sql: 'INSERT INTO fundinvest (id,accountName,share,buyPrice,buyTime,fundCode) VALUES (?,?,?,?,?,?);',
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
});
// 获取用户投资信息
router.get('/getFundInvest', (req, res) => {
  handler.exec({
    sql: `SELECT fundinvest.fundCode,fundinvest.buyTime,fundinvest.buyPrice,
    fundlist.prePrice,SUM(fundinvest.share) as share,fundinvest.accountName,fundlist.name,fundlist.currentPrice FROM fundinvest LEFT JOIN fundlist 
  on fundinvest.fundCode = fundlist.fundCode
  WHERE id=? 
  GROUP BY fundinvest.buyTime,fundinvest.fundCode`,
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
          temp[1] += (v[i].share * v[i].buyPrice).toFixed(2);
        }
        temp[2] = (temp[0] * v[0].currentPrice).toFixed(2);
        temp[3] = (temp[2] - temp[1]).toFixed(2)
        map.get(k).unshift(temp);
      }
      // console.log(map);
      res.send({data: [...map]});
    },

    error: (err) => {
      console.log(err);
      res.send({ status: false, error: err });
    },
  });
});

module.exports = router;
