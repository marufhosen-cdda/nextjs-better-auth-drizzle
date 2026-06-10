import type { BetterAuthOptions } from "better-auth";

export const rateLimit: BetterAuthOptions["rateLimit"] = {
  enabled: true,
  window: 10,
  max: 100,
  customRules: {},
};
