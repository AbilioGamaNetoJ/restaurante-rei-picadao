import { db } from '@/db';
import { products, categories, addons } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';
import { ProdutosClient } from './produtos-client';

export default async function ProdutosPage() {
  const [allProducts, allCategories, allAddons] = await Promise.all([
    db.query.products.findMany({
      orderBy: [asc(products.sortOrder)],
      with: {
        categories: {
          with: {
            category: true
          }
        },
        addons: {
          with: {
            addon: true
          }
        }
      }
    }),
    db.query.categories.findMany({
      where: eq(categories.type, 'produto'),
      orderBy: [asc(categories.sortOrder)]
    }),
    db.query.addons.findMany({
      orderBy: [asc(addons.name)]
    })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Produtos</h2>
        <p className="text-muted-foreground">
          Gerencie o cardápio e os produtos disponíveis.
        </p>
      </div>

      <ProdutosClient 
        initialProducts={allProducts} 
        categories={allCategories} 
        addons={allAddons} 
      />
    </div>
  );
}
