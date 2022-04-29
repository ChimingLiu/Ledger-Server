// 记账相关
const express = require('express');
const router = express.Router();
// toeken 设置
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
// 引入数据库连接
const handler = require('../database.js');
const updateCoin = require('../updateCoin.js');
function getUuiD(randomLength){
  return Number(Math.random().toString().substr(2,randomLength) + Date.now()).toString(36)
}

// 获取用户总余额
router.get('/accountTotalBalance', (req, res) => {
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
router.get('/outFlowType', (req, res) => {
  handler.exec({
    sql: 'SELECT * FROM inouttype WHERE typeID < 100;',
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
router.get('/inFlowType', (req, res) => {
  handler.exec({
    sql: 'SELECT * FROM inouttype WHERE typeID>99 AND typeID < 200;',
    success: (result) => {
      res.send({ status: true, data: result });
    },

    error: (err) => {
      console.log(err);
      res.send(err);
    },
  });
});


// 获取用户账本收入支出信息
router.get('/getInOutInfo', (req, res) => {
  handler.exec({
    sql:
    `SELECT r.accountID, r.accountName as accountName,l.typeID,inoutType,balance,inoutTime,typeName,iconName, \`index\`,\`comment\` 
    FROM userinout m
    LEFT JOIN inouttype l
    on m.typeID = l.typeID 
    LEFT JOIN useraccount r
    on m.accountID = r.accountID
    WHERE m.id= ?
    ORDER BY inoutTime DESC LIMIT ?,?;`,
    params: [req.query.id,req.query.length-0, req.query.length-0+20],
    success: (result) => {
      res.send({ status: true, data: result });
    },

    error: (err) => {
      console.log(err);
    },
  });

});

// 获取用户所有收入支出信息
router.get('/getAllInOutInfo', (req, res) => {
  handler.exec({
    sql:
    `SELECT r.accountID, r.accountName as accountName,inoutType,balance,inoutTime,typeName,iconName, \`index\`,\`comment\`,r.accountType,l.typeID
    FROM userinout m
    LEFT JOIN inouttype l
    on m.typeID = l.typeID 
    LEFT JOIN useraccount r
    on m.accountID = r.accountID
    WHERE m.id= ?
    ORDER BY inoutTime`,
    params: [req.query.id],
    success: (result) => {
      res.send({ status: true, data: result });
    },

    error: (err) => {
      console.log(err);
    },
  });

});

// 向后台提交记账支出数据
router.post('/outFlowCommit', (req, res) => {
  // 获取用户发送请求
  if (req.body.__proto__ === undefined)
    Object.setPrototypeOf(req.body, new Object());
  let outForm = JSON.parse(Object.keys(req.body));
  Promise.all([
    new Promise((resolve, reject) => {
      handler.exec({
        sql:
          'INSERT INTO userinout (id, accountID, inoutType, balance, inoutTime, typeID, `comment`, `index`) VALUES (?,?,?,?,?,?,?,?);',
        params: [
          outForm.id,
          outForm.accountID,
          'out',
          outForm.num,
          new Date(outForm.date),
          outForm.typeID,
          outForm.comment,
          getUuiD(10),
        ],
        success: (result) => {
          resolve(result)
        },
        error: (err) => {
          console.log(err);
          reject(err)
        },
      })
    }),
    new Promise((resolve, reject) => {
      handler.exec({
        sql:
          'UPDATE useraccount SET accountBalance=accountBalance-? WHERE id=? AND accountID=?;',
        params: [
          outForm.num,
          outForm.id,
          outForm.accountID,
        ],
        success: (result) => {
          resolve(result)
        },
        error: (err) => {
          reject(err)
        },
      })
    })
  ]).then((result) => {
    res.send(result)
  });
});

// 向后台提交记账收入数据
router.post('/inFlowCommit', (req, res) => {
  // 获取用户发送请求
  if (req.body.__proto__ === undefined)
    Object.setPrototypeOf(req.body, new Object());
  let inForm = JSON.parse(Object.keys(req.body));
  Promise.all([
    new Promise((resolve, reject) => {
      handler.exec({
        sql:
          'INSERT INTO userinout (id, accountID, inoutType, balance, inoutTime, typeID, `comment`, `index`) VALUES (?,?,?,?,?,?,?,?);',
        params: [
          inForm.id,
          inForm.accountID,
          'in',
          inForm.num,
          new Date(inForm.date),
          inForm.typeID,
          inForm.comment,
          getUuiD(10),
        ],
        success: (result) => {
          resolve(result)
        },
        error: (err) => {
          console.log(err);
          reject(err)
        },
      })
    }),
    new Promise((resolve, reject) => {
      handler.exec({
        sql:
          'UPDATE useraccount SET accountBalance=accountBalance+? WHERE id=? AND accountID=?;',
        params: [
          inForm.num,
          inForm.id,
          inForm.accountID,
        ],
        success: (result) => {
          resolve(result)
        },
        error: (err) => {
          reject(err)
        },
      })
    }),
  ]).then((result) => {
    res.send({ status: true });
  })
  
});


// 修改记账记录
router.post('/editRecord', (req, res) => {
  if (req.body.__proto__ === undefined)
    Object.setPrototypeOf(req.body, new Object());
  let form = JSON.parse(Object.keys(req.body));
  handler.exec({
    sql: 'UPDATE userinout SET typeID=?,balance=?,inoutTime=?,`comment`=? WHERE id =? AND `index`=?',
    params: [
      form.typeID,
      form.balance, 
      form.inoutTime, 
      form.comment,
      form.id,
      form.index,
    ],
    success: (result) => {
      res.send({success:true})
    },
    error: (err) => {
      res.send({ success:false });
    },
  });
})

// 删除后台指定记账记录
router.get('/deleteReccord', (req, res) => {
  handler.exec({
    sql:'DELETE FROM userinout WHERE id=? AND `index` = ?;',
    params: [req.query.id, req.query.index],
    success: (result) => {
      res.send({ status: true, data: result });
    },
    error: (err) => {
      console.log(err);
    },
  });
})

// 提交内部转账数据
router.post('/submitExchange', (req, res) => {
  // 获取用户发送请求
  if (req.body.__proto__ === undefined)
    Object.setPrototypeOf(req.body, new Object());
  let form = JSON.parse(Object.keys(req.body));
  Promise.all([
    new Promise((resolve, reject) => {
      handler.exec({
        sql:
          'INSERT INTO userinout (id, accountID, inoutType, balance, inoutTime, typeID, comment, `index`) VALUES (?,?,?,?,?,?,?,?);',
        params: [
          form.id,
          form.to,
          'in',
          form.balance,
          new Date(form.date),
          200,
          form.comment,
          getUuiD(10),
        ],
        success: (result) => {
          resolve(result)
        },
        error: (err) => {
          reject(err)
        },
      })
    }),
    new Promise((resolve, reject) => {
      handler.exec({
        sql:
          'INSERT INTO userinout (id, accountID, inoutType, balance, inoutTime, typeID, comment,`index`) VALUES (?,?,?,?,?,?,?,?);',
        params: [
          form.id,
          form.from,
          'out',
          form.balance,
          new Date(form.date),
          200,
          form.comment,
          getUuiD(10),
        ],
        success: (result) => {
          resolve(result)
        },
        error: (err) => {
          reject(err)
        },
      })
    }),
    new Promise((resolve, reject) => {
      handler.exec({
        sql:
          'UPDATE useraccount SET accountBalance=accountBalance-? WHERE id=? AND accountID=?;',
        params: [
          form.balance,
          form.id,
          form.from,
        ],
        success: (result) => {
          resolve(result)
        },
        error: (err) => {
          reject(err)
        },
      })
    }),
    new Promise((resolve, reject) => {
      handler.exec({
        sql:
          'UPDATE useraccount SET accountBalance=accountBalance+? WHERE id=? AND accountID=?;',
        params: [
          form.balance,
          form.id,
          form.to,
        ],
        success: (result) => {
          resolve(result)
        },
        error: (err) => {
          reject(err)
        },
      })
    })
  ]).then((result) => {
    res.send(result)
  });
});


// 导入用户记账信息
router.post('/importLedgerData', async (req, res) => {
  if (req.body.__proto__ === undefined)
    Object.setPrototypeOf(req.body, new Object());
  let data = JSON.parse(Object.keys(req.body));
  const id = data.id;
  data = data.data;
  let map = {};
  for(let item of data) {
    if(!map[item[1]]) {
      map[item[1]] = {
        name: item[1],
        type: item[7],
      }
    }
  }
  for(let item of Object.values(map)) {
    await exitAccount(item.name, item.type, id).then(res => {
      map[item.name].code = res
    });
  }
  for(let item of data) {
    handler.exec({
      sql: `INSERT INTO userinout (id, accountID, inoutType, balance, inoutTime, typeID, \`comment\`, \`index\`) 
      VALUES (?,?,?,?,?,?,?,?);`,
      params: [
        id,
        map[item[1]].code,
        item[3],
        parseFloat(item[2]),
        new Date(item[0]),
        Number(item[8]),
        item[5],
        getUuiD(10),
      ],
      success: (r) => {
      },
      error: (err) => {
        res.send({ msg: error });
      },
    });
  }
  res.send({status: true});
});

async function exitAccount(name, type, id) {
  return new Promise((resolve, rejcet) => {
    let code = 0;
    handler.exec({
      sql: `SELECT accountID
      FROM useraccount
      WHERE id = ? AND accountName=? AND accountType=?`,
      params: [id, name, type],
      success: async (result) => {
        if (result.length > 0) {
          code =  result[0].accountID;
          resolve(code)
        }else createAccount(name, id, type);
      }
    })
  })
}

async function createAccount(name, id, type) {
  return new Promise((resolve, reject) => {
    let accountID = getUuiD();
    handler.exec({
      sql:
        'INSERT INTO useraccount (id, accountType, accountBalance, accountName,accountRemark, accountID) VALUES (?,?,?,?,?, ?);',
      params: [
        id,
        type,
        0,
        name,
        '',
        accountID,
      ],
      success: () => {
        resolve(accountID)
      },
      error: (err) => {
        res.send({ msg: error });
      },
    });
  })
}

module.exports = router;