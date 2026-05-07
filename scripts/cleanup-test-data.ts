import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function cleanup() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  console.log('🧹 Limpando dados de teste...');

  try {
    const result = await db.delete(schema.orders)
      .where(eq(schema.orders.id, '12345678-1234-1234-1234-123456789012'));
    
    console.log('✅ Pedido de teste removido.');
  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error);
  } finally {
    // Neon HTTP client doesn't need to be closed
  }
}

cleanup();
