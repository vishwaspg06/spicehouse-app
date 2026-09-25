import pg from 'pg';
import {createApp} from './app.js';
const db=new pg.Pool({connectionString:process.env.DATABASE_URL});
async function start(){
  for(let i=0;i<20;i++){
    try{
      await db.query('CREATE TABLE IF NOT EXISTS menu_items (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, description VARCHAR(500) NOT NULL, price_inr INTEGER NOT NULL, category VARCHAR(50) NOT NULL)');
      await db.query('CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY, customer_name VARCHAR(80) NOT NULL, item_id INTEGER NOT NULL REFERENCES menu_items(id), quantity INTEGER NOT NULL, total_inr INTEGER NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
      await db.query(`INSERT INTO menu_items (name,description,price_inr,category) SELECT v.name,v.description,v.price_inr,v.category FROM (VALUES ('Paneer Tikka','Smoky paneer, mint chutney',289,'Starters'),('Masala Dosa','Crisp dosa, potato masala, sambar',159,'Mains'),('Veg Biryani','Basmati rice, warm spices, raita',249,'Mains'),('Dal Tadka','Yellow lentils, garlic tempering',199,'Mains'),('Gulab Jamun','Soft dumplings in saffron syrup',119,'Desserts'),('Mango Lassi','Chilled mango and yogurt',129,'Drinks')) AS v(name,description,price_inr,category) WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name=v.name)`);
      break;
    }catch(e){if(i===19)throw e;await new Promise(r=>setTimeout(r,1500));}
  }
  createApp(db).listen(3000,'0.0.0.0',()=>console.log('SpiceHouse API on 3000'));
}
start().catch(e=>{console.error(e);process.exit(1)});
