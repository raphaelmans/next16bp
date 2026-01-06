import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Create database connection - singleton pattern for development.
 * Uses postgres.js driver for better serverless compatibility.
 */
const createDatabase = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const isVercel = process.env.VERCEL === "1";

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
  }

  const client = postgres(connectionString, {
    connect_timeout: 30,
    idle_timeout: 20 * 60, // 20 minutes
    max_lifetime: 60 * 30, // 30 minutes
    max: isVercel ? 5 : 10, // Lower for serverless
    prepare: false,
    onnotice: isProduction ? () => {} : undefined,
  });

  return drizzle({ client, casing: "snake_case", schema });
};

// Use existing connection if available (development), otherwise create new one
const db = global.__db ?? createDatabase();

// Store connection globally in development to prevent multiple instances during hot reload
if (process.env.NODE_ENV !== "production") {
  global.__db = db;
}

declare global {
  var __db: ReturnType<typeof createDatabase> | undefined;
}

export type AppDatabase = typeof db;

export { db };
