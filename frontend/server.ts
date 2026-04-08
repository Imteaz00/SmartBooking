import "server-only";

if (!process.env.BACKEND_URL) {
  throw new Error("BACKEND_URL is not defined");
}

export const BACKEND_URL = process.env.BACKEND_URL as string;
