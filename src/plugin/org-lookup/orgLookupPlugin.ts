import type { BetterAuthPlugin } from "better-auth";
import { orgLookupEndpoints } from "./endpoints";

export const orgLookupPlugin = () =>
  ({
    id: "org-lookup",
    endpoints: orgLookupEndpoints,
  }) satisfies BetterAuthPlugin;
