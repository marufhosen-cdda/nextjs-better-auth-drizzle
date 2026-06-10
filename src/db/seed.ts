import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import path from "node:path";
import * as schema from "./schema";
import { SYSTEM_ROLES } from "../plugin/role/constants";

const LOCAL_DB_PATH = path.resolve(
  ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/b0946ac9e9f26f798f3603bc6e570ef94fe23c112b9ed581d6f3cedfa6ff08e1.sqlite",
);

async function seedRoles() {
  const sqlite = new Database(LOCAL_DB_PATH);
  const db = drizzle(sqlite, { schema });

  console.log("Seeding system roles...");

  for (const roleName of SYSTEM_ROLES) {
    const existing = await db.query.role.findFirst({
      where: eq(schema.role.name, roleName),
    });

    if (!existing) {
      await db.insert(schema.role).values({
        id: generateId(),
        name: roleName,
        isSystem: true,
        createdAt: new Date(),
      });
      console.log(`  ✓ Created: ${roleName}`);
    } else {
      console.log(`  - Skipped (exists): ${roleName}`);
    }
  }

  sqlite.close();
  console.log("Done.");
}

seedRoles().catch(console.error);
