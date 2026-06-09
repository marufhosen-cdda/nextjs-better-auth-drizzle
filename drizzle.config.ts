import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import path from "node:path";

const isStudio = process.env.DRIZZLE_STUDIO === "true";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  ...(isStudio ? {} : { driver: "d1-http" as const }),
  dbCredentials: isStudio
    ? {
      url: path.resolve(
        ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/b0946ac9e9f26f798f3603bc6e570ef94fe23c112b9ed581d6f3cedfa6ff08e1.sqlite"
      ),
    }
    : {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
      databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
      token: process.env.CLOUDFLARE_API_TOKEN!,
    },
});