const express = require('express');
const app = express();
const request = require('request');
// 引入数据库连接
const handler = require('./database.js');

app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type,Content-Length, Accept,X-Requested-With, token'
    );
    res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
    res.header('X-Powered-By', ' 3.2.1');
    if (req.method == 'OPTIONS') {
      res.sendStatus(200); /*让options请求快速返回*/
    } else {
      next();
    }
  });
const updateCoinToal = function () {
  let promise1 = new Promise((resolve, reject) => {
    request(
      'https://fxhapi.feixiaohao.com/public/v1/ticker?limit=100',
      function (error, response, body) {
        if (!error && response.statusCode == 200) {
          let data = JSON.parse(body);
          let resData = [];
          for (let i = 0; i < 100; i++) {
            let temp = {};
            temp.symbol = data[i].symbol;
            // 流通市值
            temp.market_cap_usd = data[i].market_cap_usd;
            // 24小时交易量
            temp.volume_24h_usd = data[i].volume_24h_usd;
            resData.push(temp);
          }
          resolve(resData);
        //   console.log(resData);
        } else {
          reject('err');
        }
      },
    );
  });
  return promise1
};

// updateCoinToal();
app.get('/newData',(req,res) => {
    updateCoinToal().then((resData) => {
        console.log('res', resData);
        res.send(resData)
    }).catch(err => {
        console.log(err);
    })
})
// 使用express监听端口号，
app.listen(7777, function () {
  console.log('listen to 7777......');
});
