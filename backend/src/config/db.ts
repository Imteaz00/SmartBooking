import { drizzle } from "drizzle-orm/node-postgres";
import { ENV } from "./env.js";
import { Pool } from "pg";
import * as schema from "../schema.js";

if (!ENV.database_url) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: ENV.database_url,
});

pool.on("connect", () => console.log("Database connected successfully"));
pool.on("error", (err) => console.error("Database connection error:", err));

export const db = drizzle({ client: pool, schema });
