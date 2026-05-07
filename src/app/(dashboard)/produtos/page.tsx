import { db } from '@/db';
import { products, categories, addons } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';
import { ProdutosClient } from './produtos-client';
import { AdicionaisClient } from './adicionais-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function ProdutosPage() {
  const [allProducts, productCategoriesData, allAddons, addonCategories] = await Promise.all([
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
      orderBy: [asc(addons.name)],
      with: {
        category: true
      }
    }),
    db.query.categories.findMany({
      where: eq(categories.type, 'adicional'),
      orderBy: [asc(categories.sortOrder)]
    })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Gestão do Cardápio</h2>
        <p className="text-muted-foreground">
          Gerencie os produtos principais e seus adicionais.
        </p>
      </div>

      <Tabs defaultValue="produtos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="adicionais">Adicionais</TabsTrigger>
        </TabsList>
        
        <TabsContent value="produtos" className="mt-6">
          <ProdutosClient 
            initialProducts={allProducts} 
            categories={productCategoriesData} 
            addons={allAddons} 
          />
        </TabsContent>
        
        <TabsContent value="adicionais" className="mt-6">
          <AdicionaisClient addons={allAddons} categories={addonCategories} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
