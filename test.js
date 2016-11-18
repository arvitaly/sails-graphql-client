"use strict";
const _1 = require('.');
const client = new _1.default({
    address: /*'https://api.sportbot365.ru:13370'*/ 'http://localhost:1338',
    path: '/graph'
});
client.query(`query Q1{ Site{ name } }`).then((r, jwr) => {
    console.log(r);
});
