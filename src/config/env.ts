import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({
  path: `.env.${process.env.NODE_ENV ?? "development"}`,
});

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().positive().max(65535),

  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_PORT: z.coerce.number().int().positive().max(65535),

  DATABASE_URL: z.url(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment variables:");

  console.error(z.prettifyError(result.error));

  process.exit(1);
}

export const env = result.data;
