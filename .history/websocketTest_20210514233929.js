const WebSocket = require('ws');
// 比特币更新
const updateCoin = require('./updateCoin.js');
// 引入数据库连接
const handler = require('./database.js');

const WebSocketServer = WebSocket.Server;

const wss = new WebSocketServer({
    port: 3000
});

wss.on('connection', function (ws) {
    console.log(`[SERVER] connection()`);
    ws.on('message', function (message) {
        console.log(`[SERVER] Received: ${message}`);
        setTimeout(() => {
            updateCoin.updateCoinPrice();
            handler.exec({
                sql:'SELECT  a.index,a.accountName,a.buyPrice,a.buyTime,a.floating,a.investName,a.soldPrice,a.soldTime,a.totalPrice,b.currentUSDT '+
                  'FROM investment a ,coindata b '+
                  'WHERE a.id=? AND a.investName = b.symbol AND investType=?;',
                // sql: 'SELECT * FROM investment WHERE id=? AND investType=?;',
                params: [req.query.id, req.query.type],
                success: (result) => {
                    ws.send(result, (err) => {
                        if (err) {
        
                            console.log(`[SERVER] error: ${err}`);
                        }
                    });
                },
            
                error: (err) => {
                  console.log(err);
                },
              });
        }, 1000);
    })
});

console.log('ws server started at port 3000...');

