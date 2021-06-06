const request = require('request');
// 引入数据库连接
const handler = require('./database.js');

updateCoinPrice: function () {
    let promise1 = new Promise((resolve, reject) => {
      request(
        'https://fxhapi.feixiaohao.com/public/v1/ticker?limit=200',
        function (error, response, body) {
          if (!error && response.statusCode == 200) {
            body = JSON.parse(body);
            handler.exec({
              sql: 'truncate table coindata;',
              params: [],
              success: (result) => {
                console.log('del coinDate success');
              },
              error: (err) => {
                console.log(err);
              },
            });
            for (let i = 0; i < body.length; i++) {
              handler.exec({
                sql: 'INSERT INTO coindata VALUES (?,?,?,?)',
                params: [
                  body[i].id,
                  body[i].name,
                  body[i].symbol,
                  body[i].price_usd,
                ],
                success: (result) => {},
                error: (err) => {
                  return err;
                },
              });
            }
            resolve(body[0].last_updated);
          } else {
            reject('err');
          }
        },
      );
    });
    promise1.catch((err) => {
      return err;
    });
    // console.log(timeStamp, ans,new Date());
    // if (timeStamp > 0) return timeStamp;
    // return 'notThing'
  },