import { db } from '@/db';
import { categories } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { CategoriasClient } from './categorias-client';

export default async function CategoriasPage() {
  const allCategories = await db.query.categories.findMany({
    orderBy: [asc(categories.sortOrder)],
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Categorias</h2>
        <p className="text-muted-foreground">
          Gerencie as categorias de produtos e adicionais.
        </p>
      </div>

      <CategoriasClient initialCategories={allCategories} />
    </div>
  );
}
