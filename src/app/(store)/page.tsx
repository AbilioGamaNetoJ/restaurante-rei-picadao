import * as React from 'react';
import { db } from "@/db";
import { categories, products, storeHours } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { StorefrontClient } from "./storefront-client";
import { publicProductColumns, toPublicProduct } from '@/lib/public-catalog';

export const revalidate = 60; // revalidate every minute

async function getStoreStatus() {
  // Adjust for local timezone if needed, assuming server is in local or UTC
  // Local time handling can be tricky, for simplicity we assume the server time is aligned or we handle it via client, 
  // but let's do a simple check. Actually, it's safer to just return the hours and let client check, 
  // or use UTC conversion for the store's timezone (e.g. America/Sao_Paulo).
  
  // For now, we will return a mock status or implement a basic check.
  // We'll pass the store hours to the client.
  const hours = await db.select().from(storeHours);
  return hours;
}

export default async function StorePage() {
  const fetchedCategories = await db.query.categories.findMany({
    orderBy: [asc(categories.sortOrder)],
  });

  // Filtra categorias que não devem aparecer na navegação do cliente
  const allCategories = fetchedCategories.filter(
    (c) => !c.name.toLowerCase().includes('bebida') && !c.name.toLowerCase().includes('molho extra')
  );

  const allProducts = await db.query.products.findMany({
    where: eq(products.isAvailable, true),
    orderBy: [asc(products.sortOrder)],
    columns: publicProductColumns,
    with: {
      categories: {
        columns: { categoryId: true },
      },
      addons: {
        with: {
          addon: {
            columns: { id: true, name: true, price: true, imageUrl: true },
            with: { category: { columns: { id: true, name: true } } },
          }
        }
      }
    }
  });

  const hours = await getStoreStatus();
  const settings = await db.query.storeSettings.findFirst();

  return (
    <StorefrontClient 
      categories={allCategories} 
      products={allProducts.map(toPublicProduct)}
      hours={hours} 
      settings={settings}
    />
  );
}
