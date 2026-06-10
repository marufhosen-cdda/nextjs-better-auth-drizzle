import { SystemRole } from "@/plugin/role";
import type { BetterAuthOptions } from "better-auth";


export const userConfig: BetterAuthOptions["user"] = {
  additionalFields: {
    role: {
      type: "string",
      defaultValue: "USER" satisfies SystemRole,
      input: false,
    },
  },
};
