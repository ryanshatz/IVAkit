/**
 * IVAkit Database Module
 */

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

export * from './schema';

// Create database client
const client = createClient({
    url: process.env.DATABASE_URL || 'file:./data/ivakit.db',
});

// Create drizzle instance with schema
export const db = drizzle(client, { schema });

// Export types
export type Database = typeof db;
