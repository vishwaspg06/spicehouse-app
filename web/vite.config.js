import {defineConfig} from 'vite';

// Local preview only. The deployed website uses the real Express/Postgres API.
const menu = [
  {id:1,name:'Paneer Tikka',description:'Smoky paneer, mint chutney',price_inr:289,category:'Starters'},
  {id:2,name:'Masala Dosa',description:'Crisp dosa, potato masala, sambar',price_inr:159,category:'Mains'},
  {id:3,name:'Veg Biryani',description:'Basmati rice, warm spices, raita',price_inr:249,category:'Mains'},
  {id:4,name:'Dal Tadka',description:'Yellow lentils, garlic tempering',price_inr:199,category:'Mains'},
  {id:5,name:'Gulab Jamun',description:'Soft dumplings in saffron syrup',price_inr:119,category:'Desserts'},
  {id:6,name:'Mango Lassi',description:'Chilled mango and yogurt',price_inr:129,category:'Drinks'}
];
export default defineConfig({plugins:[{
  name:'local-demo-api',
  configureServer(server){
    server.middlewares.use('/api/menu',(req,res,next)=>{
      if(req.method!=='GET') return next();
      res.setHeader('content-type','application/json');res.end(JSON.stringify(menu));
    });
    server.middlewares.use('/api/orders',(req,res,next)=>{
      if(req.method!=='POST') return next();
      let raw='';req.on('data',chunk=>raw+=chunk);req.on('end',()=>{
        try{
          const order=JSON.parse(raw);
          if(!order.customer_name || !menu.some(item=>item.id===order.item_id) || !Number.isInteger(order.quantity) || order.quantity<1 || order.quantity>20){res.statusCode=400;res.end(JSON.stringify({error:'Invalid demo order'}));return}
          res.statusCode=201;res.setHeader('content-type','application/json');res.end(JSON.stringify({id:Date.now(),demo:true}));
        }catch{res.statusCode=400;res.end(JSON.stringify({error:'Invalid JSON'}))}
      });
    });
  }
}]});
