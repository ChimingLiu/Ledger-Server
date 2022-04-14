// 引入request库
const request = require('request');
// 引入数据库连接
const handler = require('./database.js');

function getFundData() {
  const url = 'http://fund.eastmoney.com/js/fundcode_search.js';
  let resBody = {};
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      eval(body);
      handler.exec({
        sql: 'truncate table fundlist;',
        params: [],
        success: (result) => {
          console.log('del fundlist success');
        },
        error: (err) => {
          console.log(err);
        },
      });
      for (let i = 0; i < r.length; i++) {
        let data = r[i]
        handler.exec({
          sql: 'INSERT INTO fundlist  (fundcode,name, type) VALUES (?,?,?)',
          params: [data[0], data[2], data[3]],
          success: (result) => {
          },
          error: (err) => {
            console.log(err);
          },
        });
      }
    }
  });
}
// getFundData();
// 获取天天基金中的基金信息，插入到data.js文件中
function getFundPrice() {
  const url =
    'http://fund.eastmoney.com/Data/Fund_JJJZ_Data.aspx?t=1&lx=1&letter=&gsid=&text=&sort=zdf,desc&page=1,100000&atfc=&onlySale=0';
  request(url,function (error, response, body) {
    if (!error && response.statusCode == 200) {
      eval(body);
      updateFundPrice(db);
      console.log('all success');
    }
  });
}
// 更新数据库中的基金净值
function updateFundPrice(db) {
  let data = db.datas;
  console.log(data);
  for (let i = 0; i < data.length; i++) {
    handler.exec({
      sql: 'UPDATE fundlist SET currentPrice = ? WHERE fundcode = ?',
      params: [data[i][5], data[i][0]],
      success: (result) => {
      },
      error: (err) => {
        res.send({ msg: error });
      },
    });
  }
}

getFundPrice();
