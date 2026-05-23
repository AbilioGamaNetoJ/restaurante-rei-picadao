import * as React from 'react';
import { db } from "@/db";
import { categories, products, productAddons, addons, storeHours } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { StorefrontClient } from "./storefront-client";

export const revalidate = 60; // revalidate every minute

async function getStoreStatus() {
  const now = new Date();
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

  // Filtra a categoria "Bebidas" e derivados para não exibir na página do cliente
  const allCategories = fetchedCategories.filter(
    (c) => !c.name.toLowerCase().includes('bebida')
  );

  const allProducts = await db.query.products.findMany({
    where: eq(products.isAvailable, true),
    orderBy: [asc(products.sortOrder)],
    with: {
      categories: true,
      addons: {
        with: {
          addon: {
            with: {
              category: true
            }
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
      products={allProducts} 
      hours={hours} 
      settings={settings}
    />
  );
}
