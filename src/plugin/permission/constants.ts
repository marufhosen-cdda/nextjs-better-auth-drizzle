export const SYSTEM_PERMISSIONS = [
  "user:create",
  "user:read",
  "user:update",
  "user:delete",
  "role:create",
  "role:read",
  "role:update",
  "role:delete",
  "permission:manage",
  "settings:read",
  "settings:update",
] as const;

export type SystemPermission = (typeof SYSTEM_PERMISSIONS)[number];

/** Map each system role to its default set of permissions. */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  ADMIN: [...SYSTEM_PERMISSIONS],
  EMPLOYEE: ["user:read", "role:read", "settings:read"],
  USER: [],
};
