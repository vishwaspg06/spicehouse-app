import express from 'express';
export function createApp(db) {
  const app = express();
  app.use(express.json({limit:'20kb'}));
  app.get('/api/health', (_req,res) => res.json({status:'ok'}));
  app.get('/api/menu', async (_req,res,next) => {
    try { res.json((await db.query('SELECT id, name, description, price_inr, category FROM menu_items ORDER BY id')).rows); } catch(e) { next(e); }
  });
  app.post('/api/orders', async (req,res,next) => {
    const name=String(req.body.customer_name??'').trim();
    const id=Number(req.body.item_id), qty=Number(req.body.quantity);
    if (!name || name.length>80 || !Number.isSafeInteger(id) || id<1 || !Number.isSafeInteger(qty) || qty<1 || qty>20) return res.status(400).json({error:'Enter a name, valid item, and quantity from 1 to 20.'});
    try {
      const item=(await db.query('SELECT id, price_inr FROM menu_items WHERE id=$1',[id])).rows[0];
      if(!item) return res.status(404).json({error:'Menu item not found.'});
      const total=Number(item.price_inr)*qty;
      const order=(await db.query('INSERT INTO orders (customer_name,item_id,quantity,total_inr) VALUES ($1,$2,$3,$4) RETURNING id, customer_name, item_id, quantity, total_inr, created_at',[name,id,qty,total])).rows[0];
      res.status(201).json(order);
    } catch(e) { next(e); }
  });
  app.use((err,_req,res,_next)=>{console.error(err);res.status(500).json({error:'Internal server error.'});});
  return app;
}
