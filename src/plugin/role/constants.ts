export const SYSTEM_ROLES = ["USER", "ADMIN", "EMPLOYEE"] as const;
export type SystemRole = (typeof SYSTEM_ROLES)[number];
