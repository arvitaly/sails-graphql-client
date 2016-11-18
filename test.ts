import Client, { } from '.';
const client = new Client({
    address: /*'https://api.sportbot365.ru:13370'*/'http://localhost:1338',
    path: '/graph'
})
client.query(`query Q1{ Site{ name } }`).then((r, jwr)=>{
    console.log(r);
})