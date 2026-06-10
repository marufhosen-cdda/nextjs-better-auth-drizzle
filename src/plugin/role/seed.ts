import type { AuthContext } from "better-auth";
import { SYSTEM_ROLES } from "./constants";

export async function seedSystemRoles(ctx: AuthContext) {
  for (const roleName of SYSTEM_ROLES) {
    const existing = await ctx.adapter.findOne<{ id: string }>({
      model: "role",
      where: [{ field: "name", value: roleName }],
    });
    if (!existing) {
      await ctx.adapter.create({
        model: "role",
        data: {
          name: roleName,
          isSystem: true,
          createdAt: new Date(),
        },
      });
    }
  }
}
