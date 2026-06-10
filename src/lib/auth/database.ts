import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";

export const database = drizzleAdapter(getDb(), {
  provider: "sqlite",
  schema,
  transaction: false,
});
