import type { BetterAuthPlugin } from "better-auth";
import { type SystemRole } from "./constants";
import { roleEndpoints } from "./endpoints";
import { seedSystemRoles } from "./seed";

export const roleManagementPlugin = () => ({
  id: "role-management",
  schema: {
    role: {
      fields: {
        name: { type: "string", required: true, unique: true },
        isSystem: { type: "boolean", defaultValue: false, required: true },
        createdAt: { type: "date", required: true },
      },
    },
    user: {
      fields: {
        role: {
          type: "string",
          defaultValue: "USER" satisfies SystemRole,
          required: false,
          input: false,
        },
      },
    },
  },
  endpoints: roleEndpoints,
  init: async (ctx) => {
    try {
      await seedSystemRoles(ctx);
    } catch (error) {
      // Silently skip when no real DB is available (e.g. CLI codegen, build)
      if (!(error instanceof TypeError && error.message.includes("not a function"))) {
        console.error("[role-management] Failed to seed system roles:", error);
      }
    }
  },
}) satisfies BetterAuthPlugin;
