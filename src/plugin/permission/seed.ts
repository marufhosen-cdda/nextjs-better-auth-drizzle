import type { AuthContext } from "better-auth";
import { DEFAULT_ROLE_PERMISSIONS, SYSTEM_PERMISSIONS } from "./constants";

export async function seedPermissions(ctx: AuthContext) {
  const adapter = ctx.adapter;

  // 1. Seed permission definitions
  const permissionMap = new Map<string, string>(); // name → id

  for (const permName of SYSTEM_PERMISSIONS) {
    const existing = await adapter.findOne<{ id: string; name: string }>({
      model: "permission",
      where: [{ field: "name", value: permName }],
    });

    if (existing) {
      permissionMap.set(permName, existing.id);
    } else {
      const created = (await adapter.create({
        model: "permission",
        data: {
          name: permName,
          description: "",
          createdAt: new Date(),
        },
        // biome-ignore lint/suspicious/noExplicitAny: adapter type constraints are too narrow
      } as any)) as { id: string } | null;

      if (created) {
        permissionMap.set(permName, created.id);
      }
    }
  }

  // 2. Seed permission → role assignments for each system role
  for (const [roleName, permNames] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const roleRecord = await adapter.findOne<{ id: string }>({
      model: "role",
      where: [{ field: "name", value: roleName }],
    });
    if (!roleRecord) continue;

    // Get existing assignments for this role
    const existingAssignments = await adapter.findMany<{
      id: string;
      permissionId: string;
    }>({
      model: "rolePermission",
      where: [{ field: "roleId", value: roleRecord.id }],
    });
    const existingPermIds = new Set(
      existingAssignments.map((a: { permissionId: string }) => a.permissionId),
    );

    for (const permName of permNames) {
      const permId = permissionMap.get(permName);
      if (!permId) continue;

      if (!existingPermIds.has(permId)) {
        await adapter.create({
          model: "rolePermission",
          data: {
            roleId: roleRecord.id,
            permissionId: permId,
          },
          // biome-ignore lint/suspicious/noExplicitAny: adapter type constraints are too narrow
        } as any);
      }
    }
  }
}
