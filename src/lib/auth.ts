import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { interviewPlugin } from "@/plugin/interviewPlugin";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { openAPI, username } from "better-auth/plugins";

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
    plugins: [username(), nextCookies(), openAPI(), interviewPlugin()],
  });
}

export const auth = getAuth();

// export type Auth = ReturnType<typeof getAuth>;
