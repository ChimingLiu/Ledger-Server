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
const nodeMail = require('../nodeMail.js');

// 随机生成uuid
function getUuiD(randomLength){
  return Number(Math.random().toString().substr(2,randomLength) + Date.now()).toString(36)
}

/**
 * 用户登录函数
 * 生成token 
 */
router.post('/login', (req, res) => {
    //   获取用户发送请求
    if (req.body.__proto__ === undefined)
      Object.setPrototypeOf(req.body, new Object());
    let user = JSON.parse(Object.keys(req.body));
    handler.exec({
      sql: 'SELECT userName,email,budget,id FROM `user` WHERE email=? AND pwd=?;',
      params: [user.account, user.pwd],
      success: (result) => {
        if (result.length > 0) {
          //这是加密的 key（密钥）
          let secret = 'dktoken';
          //生成 Token
          let token = jwt.sign(user, secret, {
            expiresIn: 60 * 60, // 设置过期时间, 24 小时
          });
          res.send({ status: true, msg: user.account, token, id:result[0].id });
        } else {
          res.send({ status: false, msg: '账号或密码错误' });
        }
      },
      error: (err) => {
        res.send({ msg: error });
      },
    });
  });


/**
 * 用户绑定gitHub
 * 生成token 
 */
 router.post('/bindGitHubID', async (req, res) => {
  //   获取用户发送请求
  if (req.body.__proto__ === undefined)
    Object.setPrototypeOf(req.body, new Object());
  let user = JSON.parse(Object.keys(req.body));
  function accountVerify(result) {
    if (result.length === 1) {
      if (result[0].gitHubID) {
        res.send({msg:'该账户已被绑定'});
      } else {
        handler.exec({
          sql: 'UPDATE user SET gitHubID=? WHERE id=?',
          params: [user.GitHubID, result[0].id],
          success: (data) => {
            // 这是加密的 key（密钥）
            let secret = 'dktoken';
            //生成 Token
            let token = jwt.sign(user, secret, {
              expiresIn: 60 * 60, // 设置过期时间, 24 小时
            });
            res.send({ status: true, msg: user.account, token, id:result[0].id });
          },
          error: (err) => {
            res.send({ msg: error });
          },
        });
      }
    } else {
      res.send({ status: false, msg: '账号或密码错误' });
    }
  }
  // 验证用户是否存在
  await handler.exec({
    sql: 'SELECT gitHubID,id FROM `user` WHERE email=? AND pwd=?;',
    params: [user.account, user.pwd],
    success: accountVerify,
    error: (err) => {
      res.send({ msg: error });
    },
  });
  
});

// 验证token
router.get('/verifytoken', (request, response) => {
  //这是加密的 key（密钥），和生成 token 时的必须一样
  let secret = 'dktoken';
  let token = request.headers['token'];
  if (!token) {
      response.send({ status: false, message: 'token不能为空' });
  }
  jwt.verify(token, secret, (error, result) => {
      if (error) {
          response.send({ status: false, data: error });
      } else {
          response.send({ status: true, data: result });
      }
  })
})

// 测试用，获取新的token
router.get('/getNewToken', (req, res) => {
  const user = {email:'test'}
  let secret = 'dktoken';
  //生成 Token
  let token = jwt.sign(user, secret, {
    expiresIn: 60 * 60, // 设置过期时间, 24 小时
  });
  res.send({ status: true, msg: user.account, token});
})

const verificatioCode = new Map();
// 用户注册信息提交
router.post('/registerCommit', (req, res) => {
  //   获取用户发送请求
  if (req.body.__proto__ === undefined)
    Object.setPrototypeOf(req.body, new Object());
  let user = JSON.parse(Object.keys(req.body));
  let vcObj = verificatioCode.get(user.userEmail)
  // 验证码错误
  if (!verificatioCode.has(user.userEmail) || vcObj.vc != user.vc) {
    res.send({status:false, msg:'验证码错误'});
    return ;
  } else if(Date.now() - vcObj.lastTime > 300000){
    // 验证码超市
    res.send({status:false, msg:'验证码错误'})
    return;
  }
  handler.exec({
    sql: 'INSERT INTO `user` (userName, email, pwd, id) VALUES (?, ?,?,?);',
    params: [
      user.username, 
      user.userEmail, 
      user.password, 
      getUuiD(5),
    ],
    success: (result) => {
      res.send({success:true})
    },
    error: (err) => {
      res.send({ success:false });
    },
  });
})

// 发送邮箱验证码
router.get('/getVerificatioCode', async (req, res) => {
  const email = req.query.email;
  if(verificatioCode.has(email)) {
    let obj = verificatioCode.get(email);
    // 拦截两分钟内重复发送的验证码
    if(Date.now() - obj.lastTime < 120000) {
      res.send('验证码发送过于频繁，请稍后再试');
      return;
    }
  }
  //生成6位随机验证码
  const code = String(Math.floor(Math.random() * 1000000)).padEnd(6, '0') 
  //邮件配置
  const mail = {
      from: `"Ledger个人财务管理系统"<13025142863@163.com>`,// 发件人
      subject: '个人财务管理系统验证码',//邮箱主题
      to: email,//收件人，这里由post请求传递过来
      // 邮件内容，用html格式编写
      html: `
          <p>您好！</p>
          <p>您的验证码是：<strong style="color:orangered;">${code}</strong></p>
          <p>验证码5分钟内有效</p>
          <p>如果不是您本人操作，请无视此邮件</p>
      ` 
  };
  // 发送邮件
  await nodeMail.sendMail(mail, (err, info) => {
      if (!err) {
          verificatioCode.set(email, {lastTime:Date.now(), vc:code})
          res.send("验证码发送成功")
      } else {
          res.send("验证码发送失败，请稍后重试");
          console.log(err);
      }
  })
});

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
    sql: 'SELECT email,userName,budget FROM `user` WHERE id=?',
    params: [req.query.id],
    success: (result) => {
      res.send({ status: true, data: result });
    },

    error: (err) => {
      console.log(err);
    },
  });
});

// 修改用户信息
router.get('/updateUserInfo', (req, res) => {
  handler.exec({
    sql: 'UPDATE `user` SET email=?, userName=?, budget=? WHERE id=?',
    params: [req.query.email, 
            req.query.name,
            req.query.budget,
            req.query.id],
    success: (result) => {
      res.send({ status: true, data: result });
    },

    error: (err) => {
      console.log(err);
    },
  });
});

// 修改用户密码信息
router.get('/updateUserPwd', (req, res) => {
  handler.exec({
    sql: 'UPDATE `user` SET pwd=? WHERE id=?',
    params: [req.query.pwd,
            req.query.id],
    success: (result) => {
      res.send({ status: true, data: result });
    },

    error: (err) => {
      console.log(err);
    },
  });
});

// 验证原密码
router.get('/confirmPwd', (req, res) => {
  handler.exec({
    sql: 'SELECT userName FROM user WHERE id=? AND pwd=?',
    params: [req.query.id, 
            req.query.pwd,],
    success: (result) => {
      if(result.length === 0) res.send({ status: false})
      else res.send({ status: true});
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
  let accountInfo = JSON.parse(Object.keys(req.body));
  handler.exec({
    sql:
      'INSERT INTO useraccount (id, accountType, accountBalance, accountName,accountRemark, accountID) VALUES (?,?,?,?,?, ?);',
    params: [
      accountInfo.id,
      accountInfo.type,
      accountInfo.balance,
      accountInfo.name,
      accountInfo.remark,
      getUuiD(),
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
    sql: 'SELECT accountType,accountName,accountBalance,accountRemark, accountID FROM useraccount WHERE id=?;',
    params: [req.query.id],
    success: (result) => {
      // res.send({ data: result });
      handler.exec({
        sql: 'SELECT inoutType,SUM(balance) as s,accountID FROM userinout '+
              'WHERE id=? '+
              'GROUP BY accountID,inoutType',
        params: [req.query.id],
        success: (temp) => {
          for(let i=0;i<result.length;i++) {
            result[i].in = 0;
            result[i].out = 0;
            for(let j=0;j<temp.length;j++) {
              if(temp[j].accountID == result[i].accountID) {
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
    sql: 'DELETE FROM userinout WHERE id=? AND accountID=?;',
    params: [
      req.query.id,
      req.query.accountID,
    ],
    success: (result) => {
      handler.exec({
        sql:'DELETE FROM useraccount WHERE id=? AND accountID=?;',
        params: [
          req.query.id,
          req.query.accountID,
        ],
        success: (r) => {
          res.send({code:200})
        }
      },)
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

// 查询用户某月收入支出数据
router.get('/userMonthInout', (req, res) => {
  handler.exec({
    sql: 'SELECT inoutTime, SUM(balance) as sum, inoutType '+
    'FROM userinout WHERE id=? '+
    'AND  year(inoutTime)=? and month(inoutTime)=? '+
    'GROUP BY inoutTime,inoutType',
    params: [
      req.query.id,
      req.query.year,
      req.query.month,
    ],
    success: (result) => {
      res.send({data: result});
    }
  })
})

// 按月查询用户类别支出收入情况
router.get('/userMonthCategory', (req, res) => {
  handler.exec({
    sql: 'SELECT sum(userinout.balance) as \`value\`,userinout.inoutType,inouttype.typeName as \`name\`' +
    'FROM userinout LEFT JOIN inouttype '+
    'on userinout.typeID = inouttype.typeID '+
    'WHERE id =? '+
    'AND  year(inoutTime)=? and month(inoutTime)=? '+
    'GROUP BY userinout.typeID,inoutType',
    params: [
      req.query.id,
      req.query.year,
      req.query.month,
    ],
    success: (result) => {
      res.send({data: result});
    }
  })
})

// 按年查询用户类别支出收入情况
router.get('/userYearCategory', (req, res) => {
  handler.exec({
    sql: 'SELECT sum(userinout.balance) as \`value\`,userinout.inoutType,inoutType.typeName as \`name\`' +
    'FROM userinout LEFT JOIN inouttype '+
    'on userinout.typeID = inouttype.typeID '+
    'WHERE id =? '+
    'AND  year(inoutTime)=? '+
    'GROUP BY userinout.typeID,inoutType',
    params: [
      req.query.id,
      req.query.year,
      req.query.month,
    ],
    success: (result) => {
      res.send({data: result});
    }
  })
})

// 查询用户某年收入支出数据
router.get('/userYearInout', (req, res) => {
  handler.exec({
    sql: 'SELECT month(inoutTime) as m, SUM(balance) as sum, inoutType '+
    'FROM userinout WHERE id=? ' + 
    'AND  year(inoutTime)=? ' +
    'GROUP BY month(inoutTime),inoutType',
    params: [
      req.query.id,
      req.query.year,
    ],
    success: (result) => {
      res.send({data: result});
    }
  })
})

// 查询用户某一类别账户收入支出
router.get('/userAccountSum', (req, res) => {
  handler.exec({
    sql: `SELECT inoutType,SUM(userinout.balance) as sum FROM userinout 
    LEFT JOIN useraccount 
    ON userinout.accountID = useraccount.accountID
    WHERE useraccount.accountType = ?
    AND userinout.id = ?
    GROUP BY userinout.inoutType`,
    params: [
      req.query.type,
      req.query.id,
    ],
    success: (result) => {
      res.send({data: result});
    }
  })
})

// 通过token 获取用户id
router.get('/viaTokenGetID', (req, res) => {
  console.log(req.headers.token);
  res.send('ddd')
})
module.exports = router;