import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";

/**
 * Factory that returns a middleware enforcing that the authenticated user's
 * role holds the given `permission`.
 *
 * Usage:
 * ```ts
 * createAuthEndpoint("/sensitive", {
 *   use: [requirePermission("settings:update")],
 *   method: "POST",
 *   ...
 * })
 * ```
 */
export const requirePermission = (permission: string) =>
  createAuthMiddleware(async (ctx) => {
    const session = await getSessionFromCtx(ctx);
    if (!session) throw APIError.fromStatus("UNAUTHORIZED");

    const userRole = (session.user as { role?: string }).role;
    if (!userRole) {
      throw new APIError("FORBIDDEN", { message: "No role assigned to your account" });
    }

    // Resolve role id
    const roleRecord = await ctx.context.adapter.findOne<{ id: string }>({
      model: "role",
      where: [{ field: "name", value: userRole }],
    });
    if (!roleRecord) {
      throw new APIError("FORBIDDEN", { message: `Role "${userRole}" not found` });
    }

    // Resolve permission id
    const permRecord = await ctx.context.adapter.findOne<{ id: string }>({
      model: "permission",
      where: [{ field: "name", value: permission }],
    });
    if (!permRecord) {
      // Permission doesn't exist yet – treat as missing
      throw new APIError("FORBIDDEN", {
        message: `Permission "${permission}" does not exist`,
      });
    }      // Check whether a role-permission assignment exists
    const assignments = await ctx.context.adapter.findMany<{ permissionId: string }>({
      model: "rolePermission",
      where: [{ field: "roleId", value: roleRecord.id }],
    });
    const hasPermission = assignments.some((a) => a.permissionId === permRecord.id);
    if (!hasPermission) {
      throw new APIError("FORBIDDEN", {
        message: `Missing required permission: ${permission}`,
      });
    }

    return { session };
  });
