//引入express框架
const express = require('express');
const bodyParser = require('body-parser');
//创建网站服务器
const app = express();
// 引入数据库连接
const handler = require('./database.js');

const request = require('request');

module.exports = {
  updateCoinPrice: function() {
    request(
      'https://fxhapi.feixiaohao.com/public/v1/ticker?limit=200',
      function (error, response, body) {
        if (!error && response.statusCode == 200) {
          handler.exec({
            sql:
              'truncate table coindata;',
            params: [],
            success: (result) => {
              console.log('del coinDate success');
            },
            error: (err) => {
              console.log(err);;
            },
          });
          body = JSON.parse(body);
          for (let i = 0; i < body.length; i++) {
            handler.exec({
              sql:
                'INSERT INTO coindata VALUES (?,?,?,?)',
              params: [
                body[i].id,
                body[i].name,
                body[i].symbol,
                body[i].price_usd,
              ],
              success: (result) => {
              },
              error: (err) => {
                return err;
              },
            });
          }
          // console.table(body); // 请求成功的处理逻辑
        }
      },
    );
  }
}


// app.listen(5550, function () {
//   updateCoinPrice();
//   console.log('Example app listening on port 3000!');
// });
