// 引用
const express = require('express');
const app = express();
// toeken 设置
const bodyParser = require('body-parser');
// 引入数据库连接
const handler = require('./database.js');
const updateCoin = require('./updateCoin.js');

const request = require('request');
const jwt = require('jsonwebtoken');
const axios = require('axios');

/*
 *引入router
 * */
const accountRouter = require('./router/account');
const bookingRouter = require('./router/booking');
const investRouter = require('./router/invest');

app.use(bodyParser.urlencoded({ extended: false }));

const signkey = 'dktoken';
// 验证token
verToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, signkey, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// app.use(function (req, res, next) {
//   const URL = req.url;
//   if (URL === '/account/login') {
//     // 登录接口无需校验
//     next();
//     return;
//   }

//   // 获取token值
//   const authorization = req.headers['token'];
//   console.log(URL, authorization);
//   console.log(req.headers.token);
//   if (authorization === 'undefined') {
//     console.log(req.headers);
//     res.status(401).send('Unauthorized');
//   } else {
//     // 验证token
//     verToken(authorization)
//       .then((data) => {
//         req.data = data;
//         next();
//         return;
//       })
//       .catch((error) => {
//         console.log('ttk', req.headers.token);
//         res.status(401).send('Unauthorized');
//       });
//   }
// });
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type,Content-Length, Accept,X-Requested-With, token',
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
// app.use(bodyParser.urlencoded({ extended: false }));
// 账号相关路由
app.use('/account', accountRouter);
// 记账相关路由
app.use('/booking', bookingRouter);
// 记账相关路由
app.use('/invest', investRouter);
app.get('/sse', (req, res) => {
  res.header({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('data: ' + new Date() + '\n\n');
  setInterval(async () => {
    let newData = await updateCoin.SSEUpdaePrice();
    res.write('new' + JSON.stringify(newData));
  }, 5000);
});


// 通过获取github的用户信息
async function getData(code) {
  const clientID = 'f56acef48356495c9eb0';
  const clientSecret = 'd1159b6dacab2ef1bd3fe5c5912e821677ea210d';
  const requestToken = code;
  const url =
    'https://github.com/login/oauth/access_token?' +
    `client_id=${clientID}&` +
    `client_secret=${clientSecret}&` +
    `code=${requestToken}`;
  const tokenResponse = await axios({
    method: 'post',
    url: url,
    headers: {
      accept: 'application/json',
    },
  });
  const accessToken = tokenResponse.data.access_token;
  const result = await axios({
    method: 'get',
    url: `https://api.github.com/user`,
    headers: {
      accept: 'application/json',
      Authorization: `token ${accessToken}`,
    },
  });
  return result;
}

// Ouath 回调
app.get('/cb',async (req, res) => {
  // const result = await(getData(req.query.code));
  const result = {};
  result.id = '42761014';
  let url = ''
  handler.exec({
    sql: 'SELECT id,email FROM `user` WHERE gitHubID=?',
    params: [
      result.id
    ],
    success: (data) => {
      if (data.length === 0) {
        URL=`http://localhost:8080/#/redirect?gitHubID=${result.id}`;
      } else {
        // 这是加密的 key（密钥）
        let secret = 'dktoken';
        //生成 Token
        let token = jwt.sign({email: data[0].email}, secret, {
          expiresIn: 60 * 60, // 设置过期时间, 24 小时
        });
        URL=`http://localhost:8080/#/redirect?id=${data[0].id}&email=${data[0].email}&token=${token}`
      }
    },
    error: (err) => {
      // res.send({ success:false });
    },
  });
  // 如果服务器内没有改用户
  res.redirect(URL);
});

// 使用express监听端口号
app.listen(5555, function () {
  console.log('listen to 5555......');
});
