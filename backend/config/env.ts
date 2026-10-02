import "dotenv/config";
import path from "path";

import { fileURLToPath } from "url";
export const __filename = fileURLToPath(import.meta.url);
__dirname = process.cwd();
// __dirname = path.dirname(__filename);

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;

  if (!value) {
    throw new Error(`Missing env variable: ${key}`);
  }

  return value;
}

// console.log("Current working directory:", process.cwd(), __dirname, __filename);

export const env = {
  NODE_ENV: getEnv("NODE_ENV", "development"),
  HOST: getEnv("HOST", "0.0.0.0"),
  PORT: Number(getEnv("PORT", "3000")),

  HOST_URL: getEnv("HOST_URL"),
  CLIENT_URL: getEnv("CLIENT_URL"),

  ACCESS_TOKEN_SECRET: getEnv("ACCESS_TOKEN_SECRET"),
  REFRESH_TOKEN_SECRET: getEnv("REFRESH_TOKEN_SECRET"),

  DATABASE_URL: getEnv("DATABASE_URL"),

  REDIS_HOST: getEnv("REDIS_HOST"),
  REDIS_PORT: getEnv("REDIS_PORT"),

  MAIL_PORT: getEnv("MAIL_PORT"),
  MAIL_HOST: getEnv("MAIL_HOST"),
  MAIL_USERNAME: getEnv("MAIL_USERNAME"),
  MAIL_PASSWORD: getEnv("MAIL_PASSWORD"),
  MAIL_FROM: getEnv("MAIL_FROM", "customersupport@yummyhouse.com"),

  UPLOAD_DIR: path.join(__dirname, getEnv("UPLOAD_DIR")),
};
