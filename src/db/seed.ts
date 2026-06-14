import { generateId } from "better-auth";
import { Database } from "bun:sqlite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import path from "node:path";
import { DEFAULT_ROLE_PERMISSIONS, SYSTEM_PERMISSIONS } from "../plugin/permission/constants";
import { SYSTEM_ROLES } from "../plugin/role/constants";
import * as schema from "./schema";

const LOCAL_DB_PATH = path.resolve(
  ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/b0946ac9e9f26f798f3603bc6e570ef94fe23c112b9ed581d6f3cedfa6ff08e1.sqlite",
);

async function main() {
  const sqlite = new Database(LOCAL_DB_PATH);
  const db = drizzle(sqlite, { schema });

  // ── Seed system roles ──
  console.log("Seeding system roles...");
  const roleIdMap = new Map<string, string>();

  for (const roleName of SYSTEM_ROLES) {
    const existing = await db.query.role.findFirst({
      where: eq(schema.role.name, roleName),
    });

    if (!existing) {
      const id = generateId();
      await db.insert(schema.role).values({
        id,
        name: roleName,
        isSystem: true,
        createdAt: new Date(),
      });
      roleIdMap.set(roleName, id);
      console.log(`  ✓ Created: ${roleName}`);
    } else {
      roleIdMap.set(roleName, existing.id);
      console.log(`  - Skipped (exists): ${roleName}`);
    }
  }

  // ── Seed permissions ──
  console.log("Seeding permissions...");
  const permissionIdMap = new Map<string, string>();

  for (const permName of SYSTEM_PERMISSIONS) {
    const existing = await db.query.permission.findFirst({
      where: eq(schema.permission.name, permName),
    });

    if (!existing) {
      const id = generateId();
      await db.insert(schema.permission).values({
        id,
        name: permName,
        description: "",
        createdAt: new Date(),
      });
      permissionIdMap.set(permName, id);
      console.log(`  ✓ Created permission: ${permName}`);
    } else {
      permissionIdMap.set(permName, existing.id);
      console.log(`  - Skipped (exists): ${permName}`);
    }
  }

  // ── Seed role → permission assignments ──
  console.log("Seeding role-permission assignments...");
  for (const [roleName, permNames] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const roleId = roleIdMap.get(roleName);
    if (!roleId) continue;

    // Fetch existing assignments for this role
    const existingAssignments = await db
      .select()
      .from(schema.rolePermission)
      .where(eq(schema.rolePermission.roleId, roleId));
    const existingPermIds = new Set(existingAssignments.map((a) => a.permissionId));

    for (const permName of permNames) {
      const permId = permissionIdMap.get(permName);
      if (!permId) continue;

      if (!existingPermIds.has(permId)) {
        await db.insert(schema.rolePermission).values({
          id: generateId(),
          roleId,
          permissionId: permId,
        });
        console.log(`  ✓ Assigned ${permName} → ${roleName}`);
      }
    }
  }

  sqlite.close();
  console.log("Done.");
}

main().catch(console.error);
