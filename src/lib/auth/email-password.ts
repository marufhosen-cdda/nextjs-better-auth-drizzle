import type { BetterAuthOptions } from "better-auth";

export const emailAndPassword: BetterAuthOptions["emailAndPassword"] = {
  enabled: true,
  minPasswordLength: 8,
  maxPasswordLength: 32,
};
