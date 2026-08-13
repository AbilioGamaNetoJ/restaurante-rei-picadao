'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { storeSettings, storeHours } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { can, getRoleFromClaims } from '@/lib/permissions';

export async function updateStoreSettings(id: string | null, data: any) {
  const { userId, sessionClaims } = await auth();
  const role = getRoleFromClaims(sessionClaims);

  if (!userId || !can(role, 'edit_settings')) {
    throw new Error('Não autorizado');
  }

  if (id) {
    await db.update(storeSettings)
      .set({
        name: data.name,
        address: data.address,
        phone: data.phone,
        deliveryRadiusKm: data.deliveryRadiusKm,
        minOrder: data.minOrder,
        deliveryFeeKm: data.deliveryFeeKm,
        logoUrl: data.logoUrl,
        bannerUrl: data.bannerUrl,
      })
      .where(eq(storeSettings.id, id));
  } else {
    await db.insert(storeSettings).values({
      name: data.name,
      address: data.address,
      phone: data.phone,
      deliveryRadiusKm: data.deliveryRadiusKm,
      minOrder: data.minOrder,
      deliveryFeeKm: data.deliveryFeeKm,
      logoUrl: data.logoUrl,
      bannerUrl: data.bannerUrl,
    });
  }

  revalidatePath('/configuracoes');
}

export async function updateStoreHours(storeId: string, hours: any[]) {
  const { userId, sessionClaims } = await auth();
  const role = getRoleFromClaims(sessionClaims);

  if (!userId || !can(role, 'edit_settings')) {
    throw new Error('Não autorizado');
  }

  // Primeiro removemos as horas existentes
  await db.delete(storeHours).where(eq(storeHours.storeId, storeId));

  // Depois inserimos as novas
  if (hours.length > 0) {
    const values = hours.map(h => ({
      storeId,
      dayOfWeek: h.dayOfWeek,
      openTime: h.openTime,
      closeTime: h.closeTime,
    }));
    await db.insert(storeHours).values(values);
  }

  revalidatePath('/configuracoes');
}
