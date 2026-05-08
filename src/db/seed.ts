import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as dotenv from 'dotenv';
import { categories, storeSettings, storeHours } from './schema';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  console.log('Starting seed...');

  // 1. Categories
  const categoriesData = [
    { name: 'Destaques', slug: 'destaques', type: 'produto' as const, sortOrder: 1 },
    { name: 'Ofertas do Rei', slug: 'ofertas-do-rei', type: 'produto' as const, sortOrder: 2 },
    { name: 'Frango Frito Normal', slug: 'frango-frito-normal', type: 'produto' as const, sortOrder: 3 },
    { name: 'Frango Frito Especial', slug: 'frango-frito-especial', type: 'produto' as const, sortOrder: 4 },
    { name: 'Frango Frito Super Especial', slug: 'frango-frito-super-especial', type: 'produto' as const, sortOrder: 5 },
    { name: 'Picanha do Rei Normal', slug: 'picanha-do-rei-normal', type: 'produto' as const, sortOrder: 6 },
    { name: 'Picanha do Rei Especial', slug: 'picanha-do-rei-especial', type: 'produto' as const, sortOrder: 7 },
    { name: 'Camarão do Rei Normal', slug: 'camarao-do-rei-normal', type: 'produto' as const, sortOrder: 8 },
    { name: 'Camarão do Rei Especial', slug: 'camarao-do-rei-especial', type: 'produto' as const, sortOrder: 9 },
    { name: 'Camarão do Rei Super Especial', slug: 'camarao-do-rei-super-especial', type: 'produto' as const, sortOrder: 10 },
    { name: 'Isca de Peixe do Rei', slug: 'isca-de-peixe-do-rei', type: 'produto' as const, sortOrder: 11 },
    { name: 'Camarão com Isca de Peixe do Rei', slug: 'camarao-com-isca-de-peixe-do-rei', type: 'produto' as const, sortOrder: 12 },
    { name: 'Picados', slug: 'picados', type: 'produto' as const, sortOrder: 13 },
    { name: 'Mega Do Rei', slug: 'mega-do-rei', type: 'produto' as const, sortOrder: 14 },
    { name: 'Porções Individuais', slug: 'porcoes-individuais', type: 'produto' as const, sortOrder: 15 },
    { name: 'Porções', slug: 'porcoes', type: 'produto' as const, sortOrder: 16 },
    { name: 'Bebidas', slug: 'bebidas', type: 'adicional' as const, sortOrder: 17 },
    { name: 'Molhos', slug: 'molhos', type: 'adicional' as const, sortOrder: 18 },
  ];

  await db.insert(categories).values(categoriesData).onConflictDoNothing({ target: categories.slug });
  console.log('Categories seeded.');

  // 2. Store Settings
  const insertedStore = await db.insert(storeSettings).values({
    name: 'Rei do Picadão - Porções',
    address: 'R. Francisco Jacinto de Melo, 1449 - Areias, São José - SC, 88113-300',
    lat: '-27.55819000',
    lng: '-48.62910490',
    deliveryRadiusKm: '10.00',
    minOrder: '45.00',
    deliveryFeeKm: '1.50',

  }).returning({ id: storeSettings.id });
  
  const storeId = insertedStore[0].id;
  console.log('Store settings seeded.');

  // 3. Store Hours
  // 0=domingo, 1=segunda, 2=terça, 3=quarta, 4=quinta, 5=sexta, 6=sábado
  const hoursData = [
    { storeId, dayOfWeek: 1, openTime: '00:00:00', closeTime: '01:30:00' },
    { storeId, dayOfWeek: 1, openTime: '17:30:00', closeTime: '23:59:59' },
    { storeId, dayOfWeek: 2, openTime: '17:30:00', closeTime: '23:59:59' },
    { storeId, dayOfWeek: 3, openTime: '17:30:00', closeTime: '23:59:59' },
    { storeId, dayOfWeek: 4, openTime: '17:30:00', closeTime: '23:59:59' },
    { storeId, dayOfWeek: 5, openTime: '11:00:00', closeTime: '23:59:59' },
    { storeId, dayOfWeek: 6, openTime: '00:00:00', closeTime: '03:00:00' },
    { storeId, dayOfWeek: 6, openTime: '17:30:00', closeTime: '23:59:59' },
    { storeId, dayOfWeek: 0, openTime: '00:00:00', closeTime: '03:00:00' },
    { storeId, dayOfWeek: 0, openTime: '17:30:00', closeTime: '23:59:59' },
  ];

  await db.insert(storeHours).values(hoursData);
  console.log('Store hours seeded.');

  console.log('Seed completed successfully!');
}

main().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
