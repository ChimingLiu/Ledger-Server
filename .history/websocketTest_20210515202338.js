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
        setTimeout(()=>{
            let fun = updateCoin.updateCoinPrice();
            console.log('websocket output :',fun);
        }, 4000);
        setTimeout(() => {
            handler.exec({
                sql:'SELECT  a.index,a.accountName,a.buyPrice,a.buyTime,a.floating,a.investName,a.soldPrice,a.soldTime,a.totalPrice,b.currentUSDT '+
                  'FROM investment a ,coindata b '+
                  'WHERE a.id=? AND a.investName = b.symbol ',
                params: ['chiming_liu@qq.com'],
                success: (result) => {
                    ws.send(JSON.stringify(result), (err) => {
                        if (err) {
                            console.log(`[SERVER] error: ${err}`);
                        }
                    });
                },
            
                error: (err) => {
                  console.log(err);
                },
              });
        }, 60000);
    })
});

console.log('ws server started at port 3000...');

