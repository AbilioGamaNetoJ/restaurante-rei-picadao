
const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const dotenv = require('dotenv');
const { storeSettings } = require('../src/db/schema');

dotenv.config();

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function update() {
  console.log('Updating store settings to São José...');
  
  // Update the first record found (assuming only one exists)
  await db.update(storeSettings).set({
    address: 'R. Francisco Jacinto de Melo, 1449 - Areias, São José - SC, 88113-300',
    lat: '-27.55819000',
    lng: '-48.62910490',
    deliveryRadiusKm: '10.00',
    minOrder: '45.00',
    deliveryFeeKm: '1.50'
  });
  
  console.log('Store settings updated successfully!');
}

update().catch(console.error);
