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
    let timeStamp = request(
      'https://fxhapi.feixiaohao.com/public/v1/ticker?limit=200',
      async function (error, response, body) {
        if (!error && response.statusCode == 200) {
          body = JSON.parse(body);
          await handler.exec({
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
          for (let i = 0; i < body.length; i++) {
            await handler.exec({
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
          return body[0].last_updated;
        }
      },
    );
    return timeStamp;
  }
}


// app.listen(5550, function () {
//   updateCoinPrice();
//   console.log('Example app listening on port 3000!');
// });
