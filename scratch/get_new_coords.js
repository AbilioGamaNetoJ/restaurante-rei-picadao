
const { geocodeAddress } = require('./src/lib/google-maps');
require('dotenv').config();

async function check() {
  const address = 'R. Francisco Jacinto de Melo, 1449 - Areias, São José - SC, 88113-300';
  const coords = await geocodeAddress(address);
  console.log('Coordinates for new address:', coords);
}

check();
