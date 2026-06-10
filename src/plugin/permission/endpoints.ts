import { APIError } from "better-auth";
import { createAuthEndpoint } from "better-auth/api";
import * as z from "zod";
import { adminMiddleware } from "../role/middleware";

export const permissionEndpoints = {
  /** List every permission definition. */
  listPermissions: createAuthEndpoint(
    "/permission-management/list",
    { method: "GET", use: [adminMiddleware] },
    async (ctx) => {
      const permissions = await ctx.context.adapter.findMany<{
        id: string;
        name: string;
        description: string;
        createdAt: Date;
      }>({ model: "permission" });
      return ctx.json({ permissions });
    },
  ),

  /** Create a new permission. */
  createPermission: createAuthEndpoint(
    "/permission-management/create",
    {
      method: "POST",
      body: z.object({
        name: z
          .string()
          .min(1)
          .regex(
            /^[a-z]+:[a-z]+$/,
            "Permission name must follow the format `resource:action` (e.g. user:create)",
          ),
        description: z.string().default(""),
      }),
      use: [adminMiddleware],
    },
    async (ctx) => {
      const existing = await ctx.context.adapter.findOne<{ id: string }>({
        model: "permission",
        where: [{ field: "name", value: ctx.body.name }],
      });
      if (existing) {
        throw new APIError("BAD_REQUEST", { message: "Permission already exists" });
      }

      const permission = await ctx.context.adapter.create<{
        id: string;
        name: string;
        description: string;
        createdAt: Date;
      }>({
        model: "permission",
        data: {
          name: ctx.body.name,
          description: ctx.body.description,
          createdAt: new Date(),
        },
        forceAllowId: true,
      });
      return ctx.json({ permission });
    },
  ),

  /** Delete a permission (also removes all role assignments). */
  deletePermission: createAuthEndpoint(
    "/permission-management/delete",
    {
      method: "POST",
      body: z.object({ id: z.string() }),
      use: [adminMiddleware],
    },
    async (ctx) => {
      const perm = await ctx.context.adapter.findOne<{ id: string; name: string }>({
        model: "permission",
        where: [{ field: "id", value: ctx.body.id }],
      });
      if (!perm) {
        throw new APIError("NOT_FOUND", { message: "Permission not found" });
      }

      // Remove all role assignments for this permission
      const assignments = await ctx.context.adapter.findMany<{ id: string }>({
        model: "rolePermission",
        where: [{ field: "permissionId", value: perm.id }],
      });
      for (const a of assignments) {
        await ctx.context.adapter.delete({
          model: "rolePermission",
          where: [{ field: "id", value: a.id }],
        });
      }

      // Delete the permission itself
      await ctx.context.adapter.delete({
        model: "permission",
        where: [{ field: "id", value: perm.id }],
      });
      return ctx.json({ success: true });
    },
  ),

  /** List all permissions assigned to a given role. */
  getRolePermissions: createAuthEndpoint(
    "/permission-management/get-role-permissions",
    {
      method: "POST",
      body: z.object({ roleId: z.string() }),
      use: [adminMiddleware],
    },
    async (ctx) => {
      const assignments = await ctx.context.adapter.findMany<{
        id: string;
        roleId: string;
        permissionId: string;
      }>({
        model: "rolePermission",
        where: [{ field: "roleId", value: ctx.body.roleId }],
      });

      const permissionIds = assignments.map((a) => a.permissionId);
      return ctx.json({ permissionIds });
    },
  ),

  /** Assign a permission to a role. */
  assignPermission: createAuthEndpoint(
    "/permission-management/assign",
    {
      method: "POST",
      body: z.object({ roleId: z.string(), permissionId: z.string() }),
      use: [adminMiddleware],
    },
    async (ctx) => {
      const existing = await ctx.context.adapter.findOne<{ id: string }>({
        model: "rolePermission",
        where: [
          { field: "roleId", value: ctx.body.roleId },
          { field: "permissionId", value: ctx.body.permissionId },
        ],
      });
      if (existing) {
        throw new APIError("BAD_REQUEST", {
          message: "Permission already assigned to this role",
        });
      }

      await ctx.context.adapter.create({
        model: "rolePermission",
        data: {
          roleId: ctx.body.roleId,
          permissionId: ctx.body.permissionId,
        },
        forceAllowId: true,
      });
      return ctx.json({ success: true });
    },
  ),

  /** Remove a permission from a role. */
  removePermission: createAuthEndpoint(
    "/permission-management/remove",
    {
      method: "POST",
      body: z.object({ roleId: z.string(), permissionId: z.string() }),
      use: [adminMiddleware],
    },
    async (ctx) => {
      const existing = await ctx.context.adapter.findOne<{ id: string }>({
        model: "rolePermission",
        where: [
          { field: "roleId", value: ctx.body.roleId },
          { field: "permissionId", value: ctx.body.permissionId },
        ],
      });
      if (!existing) {
        throw new APIError("NOT_FOUND", {
          message: "Permission assignment not found",
        });
      }

      await ctx.context.adapter.delete({
        model: "rolePermission",
        where: [{ field: "id", value: existing.id }],
      });
      return ctx.json({ success: true });
    },
  ),
};
