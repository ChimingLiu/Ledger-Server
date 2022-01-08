// 引用
const express = require('express');
const app = express();
// toeken 设置
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
// 引入数据库连接
const handler = require('./database.js');
const updateCoin = require('./updateCoin.js')

const request = require('request');

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

app.post('/login', (req, res) => {
  //   获取用户发送请求
  if (req.body.__proto__ === undefined)
    Object.setPrototypeOf(req.body, new Object());
  // 获取用户数据有问题，后端小白无法解决暂时先这样能用
  let user = JSON.parse(Object.keys(req.body));
  handler.exec({
    sql: 'SELECT * FROM `user` WHERE id=? AND pwd=?;',
    params: [user.account, user.pwd],
    success: (result) => {
      if (result.length > 0) {
        //这是加密的 key（密钥）
        let secret = 'dktoken';
        //生成 Token
        let token = jwt.sign(user, secret, {
          expiresIn: 60 * 60, // 设置过期时间, 24 小时
        });
        res.send({ status: true, msg: user.account, token });
      } else {
        res.send({ status: false, msg: '账号或密码错误' });
      }
    },
    error: (err) => {
      res.send({ msg: error });
    },
  });
});

// 用户注册信息提交
app.post('/registerCommit', (req, res) => {
  //   获取用户发送请求
  if (req.body.__proto__ === undefined)
    Object.setPrototypeOf(req.body, new Object());
  // 获取用户数据有问题，后端小白无法解决暂时先这样能用
  let user = JSON.parse(Object.keys(req.body));
  handler.exec({
    sql: 'INSERT INTO `user` (userName, id, pwd) VALUES (?, ?,?);',
    params: [user.username, user.userEmail, user.password],
    success: (result) => {
      res.send({success:true})
    },
    error: (err) => {
      res.send({ success:false });
    },
  });
})
//验证资金账户是否存在
app.get('/validateAccountExist', (req, res) => {
  handler.exec({
    sql: 'SELECT * FROM useraccount WHERE id=? AND accountName=?;',
    params: [req.query.id, req.query.name],
    success: (result) => {
      if (result.length === 0) res.send({ exist: false });
      else {
        res.send({ exist: true });
      }
    },

    error: (err) => {
      console.log(err);
    },
  });
});
// 新建用户资金账户
app.post('/newFundAccount', (req, res) => {
  //   获取用户发送请求
  if (req.body.__proto__ === undefined)
    Object.setPrototypeOf(req.body, new Object());
  // 获取用户数据有问题，后端小白无法解决暂时先这样能用
  let accountInfo = JSON.parse(Object.keys(req.body));
  handler.exec({
    sql:
      'INSERT INTO useraccount (id, accountType, accountBalance, accountName) VALUES (?,?,?,?);',
    params: [
      accountInfo.id,
      accountInfo.type,
      accountInfo.balance,
      accountInfo.name,
    ],
    success: (result) => {
      if (result.affectedRows > 0) {
        res.send({ status: true });
      } else {
        res.send({ status: false });
      }
    },
    error: (err) => {
      res.send({ msg: error });
    },
  });
});

// 获取用户资金账户
app.get('/getFundAccount', (req, res) => {
  handler.exec({
    sql: 'SELECT accountType,accountName FROM useraccount WHERE id=?;',
    params: [req.query.id],
    success: (result) => {
      res.send({ data: result });
    },

    error: (err) => {
      console.log(err);
    },
  });
});

app.get('/accountAccontInfo', (req, res) => {
  Promise.all([
    new Promise((resolve, reject) => {
      handler.exec({
        sql: 'SELECT SUM(accountBalance) as Balance FROM useraccount WHERE id = ?;',
        params: [req.query.id],
        success: (result) => {
          if (!result) {
            console.log('aaaa', result);
            resolve(0);
            return;
          }
          result = JSON.parse(JSON.stringify(result));
          resolve(result[0].Balance)
        },
        error: (err) => {
          console.log(err);
          reject(err)
        },
      })
    }),
    new Promise((resolve, reject) => {
      handler.exec({
        sql: 'select SUM(balance) as monthOut from userinout where date_format(inoutTime,\'%Y-%m\')=date_format(now(),\'%Y-%m\') AND id=? AND inoutType = \'out\';',
        params: [req.query.id],
        success: (result) => {
          if(!result) {
            resolve(0);
            return;
          }
          result = JSON.parse(JSON.stringify(result));
          resolve(result[0].monthOut)
        },
        error: (err) => {
          console.log(err);
          reject(err)
        },
      })
    }),
    new Promise((resolve, reject) => {
      handler.exec({
        sql: 'select SUM(balance) as monthIn from userinout where date_format(inoutTime,\'%Y-%m\')=date_format(now(),\'%Y-%m\') AND id=? AND inoutType = \'in\';',
        params: [req.query.id],
        success: (result) => {
          if (!result) {
            resolve(0);
            return;}
          console.log(result);
          result = JSON.parse(JSON.stringify(result));
          console.log(result);
          resolve(result[0].monthIn)
        },
        error: (err) => {
          console.log(err);
          reject(err)
        },
      })
    }),
    new Promise((resolve, reject) => {
      handler.exec({
        sql: 'SELECT budget FROM user WHERE id=?',
        params: [req.query.id],
        success: (result) => {
          console.log(result);
          if (!result) {
            resolve(0);
            return;}
          result = JSON.parse(JSON.stringify(result));
          resolve(result[0].budget)
        },
        error: (err) => {
          console.log(err);
          reject(err)
        },
      })
    })
  ]).then((result) => {
    console.log('res',result);
    let accountInfo = {
      curBalance:result[0]? result[0]:0,
      monthOut: result[1]? result[1]:0,
      monthIn: result[2]? result[2]:0,
      budget: result[3]? result[3]:0,
    }
    res.send(accountInfo)
  })
})


// 获取用户总余额
app.get('/accountTotalBalance', (req, res) => {
  handler.exec({
    sql: 'SELECT SUM(accountBalance) FROM useraccount WHERE id = ?;',
    params: [req.query.id],
    success: (result) => {

      res.send({ data: result });
    },
    error: (err) => {
      console.log(err);
    },
  });
})

// 获取支出类型
app.get('/outFlowType', (req, res) => {
  handler.exec({
    sql: 'SELECT * FROM outflowtype;',
    success: (result) => {
      res.send({ status: true, data: result });
    },

    error: (err) => {
      console.log(err);
      res.send(err);
    },
  });
});
// 获取收入类型
app.get('/inFlowType', (req, res) => {
  handler.exec({
    sql: 'SELECT * FROM inflowtype;',
    success: (result) => {
      res.send({ status: true, data: result });
    },

    error: (err) => {
      console.log(err);
      res.send(err);
    },
  });
});

// 获取用户信息
app.get('/getInfo', (req, res) => {
  handler.exec({
    sql: 'SELECT * FROM `user` WHERE id=?',
    params: [req.query.id],
    success: (result) => {
      res.send({ status: true, data: result });
    },

    error: (err) => {
      console.log(err);
    },
  });
});

// 获取用户收入支出信息
app.get('/getInOutInfo', (req, res) => {
  handler.exec({
    sql:
      'SELECT accountName,inoutType,balance,inoutTime,typeName,iconName FROM userinout m LEFT JOIN inouttype l on m.typeID = l.typeID WHERE id=? ' +
      'ORDER BY inoutTime DESC LIMIT ?,?;',
    params: [req.query.id,req.query.length-0, req.query.length-0+20],
    success: (result) => {
      res.send({ status: true, data: result });
    },

    error: (err) => {
      console.log(err);
    },
  });
});

// 向后台提交记账支出数据
app.post('/outFlowCommit', (req, res) => {
  // 获取用户发送请求
  if (req.body.__proto__ === undefined)
    Object.setPrototypeOf(req.body, new Object());
  let outForm = JSON.parse(Object.keys(req.body));
  console.log(outForm);
  handler.exec({
    sql:
      'INSERT INTO userinout (id, accountName, inoutType, balance, inoutTime, typeID) VALUES (?,?,?,?,?,?);\
      UPDATE useraccount SET accountBalance=accountBalance-? WHERE id=? AND accountName=?;',
    params: [
      outForm.id,
      outForm.account,
      'out',
      outForm.num,
      new Date(outForm.date),
      outForm.typeID,

      outForm.num,
      outForm.id,
      outForm.account,

    ],
    success: (result) => {
      console.log(result);
      res.send({ status: true });
    },
    error: (err) => {
      res.send({ msg: error });
    },
  });
});
// 向后台提交记账收入数据
app.post('/inFlowCommit', (req, res) => {
  // 获取用户发送请求
  if (req.body.__proto__ === undefined)
    Object.setPrototypeOf(req.body, new Object());
  let outForm = JSON.parse(Object.keys(req.body));
  handler.exec({
    sql:
      'INSERT INTO userinout (id, accountName, inoutType, balance, inoutTime, typeID) VALUES (?,?,?,?,?,?);',
    params: [
      outForm.id,
      outForm.account,
      'in',
      outForm.num,
      new Date(outForm.date),
      outForm.typeID,
    ],
    success: (result) => {
      res.send({ status: true });
    },
    error: (err) => {
      res.send({ msg: error });
    },
  });
});

// 提交内部转账数据
app.post('/submitExchange', (req, res) => {
  if (req.body.__proto__ === undefined)
    Object.setPrototypeOf(req.body, new Object());
  let user = JSON.parse(Object.keys(req.body));
  res.send({ status: true });
});

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
