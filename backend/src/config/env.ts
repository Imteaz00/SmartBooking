import dotenv from "dotenv";

dotenv.config({ quiet: true });

export const ENV = {
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  frontend_url: process.env.FRONTEND_URL,
} as const;
