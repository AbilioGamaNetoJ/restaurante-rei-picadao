import { db } from './index';
import { products, productCategories } from './schema';

async function migrate() {
  console.log('Starting migration...');
  
  const allProducts = await db.select({
    id: products.id,
    categoryId: products.categoryId,
  }).from(products);

  console.log(`Found ${allProducts.length} products to migrate.`);

  for (const product of allProducts) {
    if (product.categoryId) {
      try {
        await db.insert(productCategories).values({
          productId: product.id,
          categoryId: product.categoryId,
        }).onConflictDoNothing();
        console.log(`Migrated product ${product.id}`);
      } catch (error) {
        console.error(`Error migrating product ${product.id}:`, error);
      }
    }
  }

  console.log('Migration finished.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
