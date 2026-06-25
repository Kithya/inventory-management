import "dotenv/config";
import { z } from "zod";

const rawSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(8000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),
  CLIENT_ORIGINS: z.string().default("http://localhost:3000"),
  APP_URL: z.string().url().optional(),
  APP_BASE_URL: z.string().url().optional(),
  AUTH_REQUIRED: z
    .enum(["true", "false"])
    .optional(),
  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  REFRESH_COOKIE_NAME: z.string().default("inventory_refresh"),
  INVITE_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  RESET_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(30),
});

const parsed = rawSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid server environment: ${details}`);
}

const authRequired =
  parsed.data.AUTH_REQUIRED === undefined
    ? parsed.data.NODE_ENV === "production"
    : parsed.data.AUTH_REQUIRED === "true";

const jwtAccessSecret =
  parsed.data.JWT_ACCESS_SECRET ??
  parsed.data.JWT_SECRET ??
  parsed.data.AUTH_SECRET;

if (authRequired && (!jwtAccessSecret || jwtAccessSecret.length < 32)) {
  throw new Error("JWT_ACCESS_SECRET must be at least 32 characters when auth is enabled.");
}

const devAccessSecret =
  "development-only-local-auth-secret-change-before-production";

export const env = {
  ...parsed.data,
  APP_URL: parsed.data.APP_URL ?? parsed.data.APP_BASE_URL ?? "http://localhost:3000",
  AUTH_REQUIRED: authRequired,
  JWT_ACCESS_SECRET: jwtAccessSecret ?? devAccessSecret,
  DIRECT_URL: parsed.data.DIRECT_URL ?? parsed.data.DATABASE_URL,
  CLIENT_ORIGINS: parsed.data.CLIENT_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};

export type Env = typeof env;
