// 账户相关
const express = require('express');
const router = express.Router();
// toeken 设置
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
// 引入数据库连接
const handler = require('../database.js');
const updateCoin = require('../updateCoin.js');
const { Route } = require('express');

/**
 * 用户登录函数
 * 生成token 
 */
router.post('/login', (req, res) => {
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

router.get('/verifytoken', (request, response) => {
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

  
// 用户注册信息提交
router.post('/registerCommit', (req, res) => {
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
router.get('/validateAccountExist', (req, res) => {
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

// 获取用户信息
router.get('/getInfo', (req, res) => {
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


// 验证账户是否存在
router.get('/validateAccountExist', (req, res) => {
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
router.post('/newFundAccount', (req, res) => {
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
router.get('/getFundAccount', (req, res) => {
  handler.exec({
    sql: 'SELECT accountType,accountName,accountBalance FROM useraccount WHERE id=?;',
    params: [req.query.id],
    success: (result) => {
      // res.send({ data: result });
      handler.exec({
        sql: 'SELECT inoutType,SUM(balance) as s,accountName FROM userinout '+
              'WHERE id=? '+
              'GROUP BY accountName,inoutType',
        params: [req.query.id],
        success: (temp) => {
          for(let i=0;i<result.length;i++) {
            result[i].in = 0;
            result[i].out = 0;
            for(let j=0;j<temp.length;j++) {
              if(temp[j].accountName == result[i].accountName) {
                result[i][temp[j].inoutType] = temp[j].s;
              }
            }
          }
          res.send({data:result})
        }
      })
    },

    error: (err) => {
      console.log(err);
    },
  });
});

// 删除用户账户及其对应记账记录
router.get('/deleteAccount', (req,res) => {
  handler.exec({
    sql: 'DELETE FROM userinout WHERE id=? AND accountName=?;' +
          'DELETE FROM useraccount WHERE id=? AND accountName=?;',
    params: [
      req.query.id,
      req.query.accountName,
      req.query.id,
      req.query.accountName,
    ],
    success: (result) => {
      console.log(result,'ddddd');
      res.send({code:200})
    }
  })
})

// 获取用户账户信息总览
router.get('/accountAccontInfo', (req, res) => {
  Promise.all([
    new Promise((resolve, reject) => {
      handler.exec({
        sql: 'SELECT SUM(accountBalance) as Balance FROM useraccount WHERE id = ?;',
        params: [req.query.id],
        success: (result) => {
          if (!result) {
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
          result = JSON.parse(JSON.stringify(result));
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
    let accountInfo = {
      curBalance:result[0]? result[0]:0,
      monthOut: result[1]? result[1]:0,
      monthIn: result[2]? result[2]:0,
      budget: result[3]? result[3]:0,
    }
    res.send(accountInfo)
  })
})

module.exports = router;