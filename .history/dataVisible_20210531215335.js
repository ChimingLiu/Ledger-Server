const request = require('request');
// 引入数据库连接
const handler = require('./database.js');

const updateCoinToal =  function () {
    let promise1 = new Promise((resolve, reject) => {
      request(
        'https://fxhapi.feixiaohao.com/public/v1/ticker?limit=100',
        function (error, response, body) {
          if (!error && response.statusCode == 200) {
            let data = JSON.parse(body);
            let resData = [];
            for(let i = 0;i<100;i++){
                let temp = {}
                temp.symbol = data[i].symbol;
                // 流通市值
                temp.market_cap_usd = data[i].market_cap_usd
                // 24小时交易量
                temp.volume_24h_usd = data[i].volume_24h_usd;
                resData.push(temp);
            }

            console.log(resData);
          } else {
            reject('err');
          }
        },
      );
    });
    promise1.catch((err) => {
      return err;
    });
  };

  
  updateCoinToal();