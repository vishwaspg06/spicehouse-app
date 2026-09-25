import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from './app.js';
const db={query:async(sql)=>({rows:sql.startsWith('SELECT')?[{id:1,name:'Paneer Tikka',price_inr:289}]:[{id:7,total_inr:578}],rowCount:1})};
test('menu and order validation',async()=>{
  const server=createApp(db).listen(0);
  try{
    const base=`http://127.0.0.1:${server.address().port}`;
    assert.equal((await(await fetch(base+'/api/health')).json()).status,'ok');
    assert.equal((await(await fetch(base+'/api/menu')).json()).length,1);
    const post=body=>fetch(base+'/api/orders',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    assert.equal((await post({customer_name:'A',item_id:1,quantity:0})).status,400);
    assert.equal((await post({customer_name:'A',item_id:1,quantity:2})).status,201);
  }finally{server.close()}
});
