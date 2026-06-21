import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error('Missing DATABASE_URL environment variable');
}

const pool = new Pool({
  connectionString: dbUrl,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

export { prisma };
