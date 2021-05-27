

const express  = require('express');
const app = express();
const bodyParser = require('body-parser');
// 引入request库
const request = require('request');
app.use(bodyParser.urlencoded({ extended: false }));
// 引入数据库连接
const handler = require('./database.js');

app.get('/test',(req, res) => {
    res.send('yes')
})
// INSERT INTO fundlist  (fundcode,name, type) VALUES ('a','d','d')
// 使用express监听端口号，
app.listen(8888, function () {
    console.log('listen to 8888......');
    const url = 'http://fund.eastmoney.com/js/fundcode_search.js';
  let resBody = {};
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      resBody = body.replace(/var\sr\s=\s/,"");
      resBody = resBody.replace('\[\[','')
      resBody = resBody.replace('\]\]\;',"")
      resBody = resBody.split('],[')
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
      for(let i=0;i<resBody.length;i++){
        let data = resBody[i].replace(/\"/g,"");
        data = data.split(',')
        handler.exec({
            sql: 'INSERT INTO fundlist  (fundcode,name, type) VALUES (?,?,?)',
            params: [data[0],data[2],data[3]],
            success: (result) => {
                console.log(data[0]);
            },
            error: (err) => {
              console.log(err);
            },
          });
      }
    }
  });
})  
