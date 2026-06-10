import { authPlugins } from "@/plugin/auth";
import { betterAuth } from "better-auth";
import { database } from "./database";
import { emailAndPassword } from "./email-password";
import { rateLimit } from "./rate-limit";

export function getAuth() {
  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    database,
    emailAndPassword,
    rateLimit,
    plugins: authPlugins,
  });
}

export const auth = getAuth();
