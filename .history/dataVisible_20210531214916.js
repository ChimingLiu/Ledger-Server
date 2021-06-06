const request = require('request');
// 引入数据库连接
const handler = require('./database.js');

const updateCoinToal =  function () {
    let promise1 = new Promise((resolve, reject) => {
      request(
        'https://fxhapi.feixiaohao.com/public/v1/ticker?limit=100',
        function (error, response, body) {
          if (!error && response.statusCode == 200) {
            console.log(body);
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
  };