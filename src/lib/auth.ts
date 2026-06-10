import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { captcha, openAPI, twoFactor, username } from "better-auth/plugins";

export function getAuth() {
  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    database: drizzleAdapter(getDb(), {
      provider: "sqlite",
      schema,
      transaction: false,
    }),
    emailAndPassword: {
      enabled: true,
    },
    rateLimit: {
      enabled: true,
      window: 10, //time window in seconds
      max: 100, //max requests in that window
      customRules: {}
    },
    plugins: [username(), nextCookies(), openAPI(), twoFactor(), captcha({
      provider: "cloudflare-turnstile",
      secretKey: process.env.TRANSTILE_SECRET_KEY as string,
    })],
  });
}

export const auth = getAuth();

// export type Auth = ReturnType<typeof getAuth>;
