// 引入request库
const request = require('request');
// 引入数据库连接
const handler = require('./database.js');

function getFundData() {
  const url =
    'http://87.push2.eastmoney.com/api/qt/clist/get?cb=jQuery112406526563715394427_1631116233755&pn=1&pz=10000&po=1&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281&fltt=2&invt=2&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f12,f14';
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      let temp = body.split('(')[1];
      temp = temp.split(')')[0];
      const totalData = JSON.parse(temp).data.diff;
      // handler.exec({
      //   sql: 'truncate table stock;',
      //   params: [],
      //   success: (result) => {
      //     console.log('del fundlist success');
      //   },
      //   error: (err) => {
      //     console.log(err);
      //   },
      // });
      for (let item of totalData) {
        handler.exec({
          sql: 'INSERT INTO investlist  (name,code,type) VALUES (?,?,\'stock\')',
          params: [item.f14, item.f12],
          success: (result) => {
            console.log('d', item.f12);
          },
          error: (err) => {
            console.log(err);
          },
        });
      }
    }
  });
}
getFundData();
