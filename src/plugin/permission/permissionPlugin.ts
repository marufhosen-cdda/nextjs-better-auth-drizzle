import type { BetterAuthPlugin } from "better-auth";
import { permissionEndpoints } from "./endpoints";
import { seedPermissions } from "./seed";

export const permissionManagementPlugin = () => ({
  id: "permission-management",
  schema: {
    permission: {
      fields: {
        name: { type: "string", required: true, unique: true },
        description: { type: "string", required: false },
        createdAt: { type: "date", required: true },
      },
    },
    rolePermission: {
      fields: {
        roleId: { type: "string", required: true },
        permissionId: { type: "string", required: true },
      },
    },
  },
  endpoints: permissionEndpoints,
  init: async (ctx) => {
    try {
      await seedPermissions(ctx);
    } catch (error) {
      if (
        !(
          error instanceof TypeError &&
          (error.message.includes("not a function") || error.message.includes("Cannot read"))
        )
      ) {
        console.error("[permission-management] Failed to seed permissions:", error);
      }
    }
  },
}) satisfies BetterAuthPlugin;
