const mysql = require('mysql');
 
/**
 * 数据库操作封装
 */
module.exports = {
    config: {
        host: 'localhost',
        port: 3306,
        database: 'mydb',
        user: 'root',
        password: '123456',
        useConnectionPooling: true // 使用连接池
    },
    // config: {
    //     host: '149.28.41.83',
    //     port: 3306,
    //     database: 'mydb',
    //     user: 'mydb',
    //     password: 'mydb',
    //     useConnectionPooling: true // 使用连接池
    // },
    pool: null,
    /**
     * 创建连接池
     */
    create: function () {
        const me = this;
        // 没有pool的才创建
        if (!me.pool) {
            me.pool = mysql.createPool(me.config);
        }
    },
    /**
     * 执行sql
     * @param {Object} config 操作对象
     */
    exec: function (config) {
        const me = this;
        me.create();
        me.pool.getConnection((err, conn) => {
            if (err) {
                console.log('mysql pool getConnections err:' + err);
                throw err;
            } else {
                conn.query(config.sql, config.params, (err, result) => {
                    if (config.success) {
                        config.success(result);
                    }
                    else if (config.error) {
                        config.error(err)
                    }
                    // 释放连接到连接池
                    conn.release();
                });
            }
        });
    }
};
 
