// 引用
const express = require('express');
const app = express();
// toeken 设置
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
// 引入数据库连接
const handler = require('./database.js');
const updateCoin = require('./updateCoin.js');

const request = require('request');


/* 
 *引入router 
 * */
const accountRouter = require('./router/account');
const bookingRouter = require('./router/booking');
const investRouter = require('./router/invest');

app.use(bodyParser.urlencoded({ extended: false }));

// app.get('/api/getCoinPrice', async (req, res) => {
//   const queryBody = req.query;
//   console.log(req.query);
//   const url = 'https://api.zb.today/data/v1/ticker/?market=' + req.query.market;
//   let resBody = {};
//   request(url, function (error, response, body) {
//     if (!error && response.statusCode == 200) {
//       resBody = body;
//       res.header('Access-Control-Allow-Origin', '*');
//       res.header(
//         'Access-Control-Allow-Headers',
//         'Content-Type,Content-Length, Auth, Accept,X-Requested-With',
//       );
//       res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
//       res.header('X-Powered-By', ' 3.2.1');
//       body = JSON.parse(body);
//       res.send({ body });
//       console.log(body); // 请求成功的处理逻辑
//     }
//   });
// });

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

//拦截所有请求
//extended:false 方法内部使用querystring模块处理请求参数的格式
//extended:true 方法内部使用第三方模块qs处理请求参数的格式
app.use(bodyParser.urlencoded({ extended: false }));

// 账号相关路由
app.use('/account', accountRouter);


// 记账相关路由
app.use('/booking', bookingRouter);

// 记账相关路由
app.use('/invest', investRouter);

app.get('/sse', (req,res) => {
  res.header({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });
  res.write("data: " + (new Date()) + "\n\n");
  setInterval(async () => {
    let newData = await updateCoin.SSEUpdaePrice();
    res.write('new'+ JSON.stringify(newData));
  }, 5000);
})






// 使用express监听端口号，
app.listen(5555, function () {
  console.log('listen to 5555......');
});
