import { APIError } from "better-auth";
import { createAuthEndpoint } from "better-auth/api";
import * as z from "zod";
import { adminMiddleware } from "./middleware";

export const roleEndpoints = {
  listRoles: createAuthEndpoint(
    "/role-management/list",
    { method: "GET", use: [adminMiddleware] },
    async (ctx) => {
      const roles = await ctx.context.adapter.findMany<{
        id: string;
        name: string;
        isSystem: boolean;
        createdAt: Date;
      }>({ model: "role" });
      return ctx.json({ roles });
    },
  ),

  createRole: createAuthEndpoint(
    "/role-management/create",
    {
      method: "POST",
      body: z.object({ name: z.string().min(1) }),
      use: [adminMiddleware],
    },
    async (ctx) => {
      const existing = await ctx.context.adapter.findOne<{ id: string }>({
        model: "role",
        where: [{ field: "name", value: ctx.body.name }],
      });
      if (existing) {
        throw new APIError("BAD_REQUEST", { message: "Role already exists" });
      }
      const role = await ctx.context.adapter.create<{
        id: string;
        name: string;
        isSystem: boolean;
        createdAt: Date;
      }>({
        model: "role",
        data: { name: ctx.body.name, isSystem: false, createdAt: new Date() },
        forceAllowId: true,
      });
      return ctx.json({ role });
    },
  ),

  updateRole: createAuthEndpoint(
    "/role-management/update",
    {
      method: "POST",
      body: z.object({ id: z.string(), name: z.string().min(1) }),
      use: [adminMiddleware],
    },
    async (ctx) => {
      const role = await ctx.context.adapter.findOne<{ id: string; isSystem: boolean }>({
        model: "role",
        where: [{ field: "id", value: ctx.body.id }],
      });
      if (!role) {
        throw new APIError("NOT_FOUND", { message: "Role not found" });
      }
      if (role.isSystem) {
        throw new APIError("FORBIDDEN", { message: "System roles cannot be modified" });
      }
      const updated = await ctx.context.adapter.update<{
        id: string;
        name: string;
        isSystem: boolean;
        createdAt: Date;
      }>({
        model: "role",
        where: [{ field: "id", value: ctx.body.id }],
        update: { name: ctx.body.name },
      });
      return ctx.json({ role: updated });
    },
  ),

  deleteRole: createAuthEndpoint(
    "/role-management/delete",
    {
      method: "POST",
      body: z.object({ id: z.string() }),
      use: [adminMiddleware],
    },
    async (ctx) => {
      const role = await ctx.context.adapter.findOne<{ id: string; isSystem: boolean; name: string }>({
        model: "role",
        where: [{ field: "id", value: ctx.body.id }],
      });
      if (!role) {
        throw new APIError("NOT_FOUND", { message: "Role not found" });
      }
      if (role.isSystem) {
        throw new APIError("FORBIDDEN", { message: "System roles cannot be deleted" });
      }
      await ctx.context.adapter.delete({
        model: "role",
        where: [{ field: "id", value: ctx.body.id }],
      });
      return ctx.json({ success: true });
    },
  ),
};
