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





// 向后台提交虚拟货币交易记录
app.post('/postTradingData', (req, res) => {
  if (req.body.__proto__ === undefined)
    Object.setPrototypeOf(req.body, new Object());
  let user = JSON.parse(Object.keys(req.body));
  handler.exec({
    sql:
      'INSERT INTO investment (id,accountName,investType,totalPrice,buyPrice,buyTime,investName) VALUES (?,?,?,?,?,?,?);',
    params: [
      user.id,
      user.accountName,
      'coin',
      user.totalPrice,
      user.buyPrice,
      new Date(user.buyTime),
      user.name,
    ],
    success: (result) => {
      res.send({ status: true });
    },
    error: (err) => {
      res.send({ msg: error });
    },
  });
});
// 获取后台投资信息
app.get('/getInvestment',async (req, res) => {
  handler.exec({
    sql:'SELECT  a.index,a.accountName,a.buyPrice,a.buyTime,a.floating,a.investName,a.soldPrice,a.soldTime,a.totalPrice,b.currentUSDT '+
      'FROM investment a ,coindata b '+
      'WHERE a.id=? AND a.investName = b.symbol AND investType=?;',
    // sql: 'SELECT * FROM investment WHERE id=? AND investType=?;',
    params: [req.query.id, req.query.type],
    success: (result) => {
      res.send({ status: true, data: result });
    },

    error: (err) => {
      console.log(err);
    },
  });
});
// 后台获取支持的虚拟货币
app.get('/getCoinType', (req, res) =>{
  handler.exec({
    sql:'SELECT  symbol FROM coinData',
    success: (result) => {
      res.send({ status: true, data: result });
    },

    error: (err) => {
      console.log(err);
    },
  });
})
// 请求获取基金代码
app.get('/getFundCode', (req,res)=>{
  handler.exec({
    sql:'SELECT fundcode,name FROM fundlist WHERE fundcode LIKE ? LIMIT 6',
    params: [ req.query.code+'%' ],
    success: (result) => {
      res.send({ status: true, data: result });
    },

    error: (err) => {
      console.log(err);
    },
  });
})
// 向后台提交基金投资信息
app.post('/postFundData', (req, res) => {
  if (req.body.__proto__ === undefined)
    Object.setPrototypeOf(req.body, new Object());
  let user = JSON.parse(Object.keys(req.body));
  handler.exec({
    sql:
      'INSERT INTO fundinvest (id,accountName,totalPrice,buyPrice,buyTime,fundCode) VALUES (?,?,?,?,?,?);',
    params: [
      user.id,
      user.accountName,
      user.totalPrice,
      user.buyPrice,
      new Date(user.buyTime),
      user.code,
    ],
    success: (result) => {
      res.send({ status: true });
    },
    error: (err) => {
      res.send({ msg: error });
    },
  });
})
// 获取用户投资信息
app.get('/getFundInvest', (req,res) => {handler.exec({
  sql:`SELECT fundinvest.fundCode,fundinvest.buyTime,fundinvest.buyPrice,fundinvest.floating,fundinvest.totalPrice,fundinvest.accountName,fundlist.name,fundlist.currentPrice FROM fundinvest LEFT JOIN fundlist 
  on fundinvest.fundCode = fundlist.fundCode
  WHERE id=?`,
  params: [ req.query.id],
  success: (result) => {
    res.send({ status: true, data: result });
  },

  error: (err) => {
    console.log(err);
    res.send({ status: false, error: err });
  },
});

})
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

app.get('/verifytoken', (request, response) => {
    //这是加密的 key（密钥），和生成 token 时的必须一样
    let secret = 'dktoken';
    let token = request.headers['token'];
    if (!token) {
        response.send({ status: false, message: 'token不能为空' });
    }
    jwt.verify(token, secret, (error, result) => {
        if (error) {
          console.log(error);
            response.send({ status: false, data: error });
        } else {
          console.log(result);
            response.send({ status: true, data: result });
        }
    })
})




// 使用express监听端口号，
app.listen(5555, function () {
  console.log('listen to 5555......');
});
