import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Fallback defaults to ensure app starts up in Demo Mode if env variables are not configured yet
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_Nepal_HR_2026';

const envSchema = z.object({
  PORT: z.union([z.string(), z.number()]).transform((val) => String(val)).default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/postgres'),
  JWT_SECRET: z.string().default('default_jwt_secret_Nepal_HR_2026'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  GEMINI_API_KEY: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
