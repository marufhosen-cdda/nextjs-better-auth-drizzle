import type { BetterAuthClientPlugin } from "better-auth";
import { orgLookupPlugin } from "./orgLookupPlugin";

export const orgLookupClientPlugin = () =>
  ({
    id: "org-lookup",
    $InferServerPlugin: {} as ReturnType<typeof orgLookupPlugin>,
  }) satisfies BetterAuthClientPlugin;
