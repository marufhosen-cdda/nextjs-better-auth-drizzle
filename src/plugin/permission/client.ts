import type { BetterAuthClientPlugin } from "better-auth/client";
import { permissionManagementPlugin } from "./permissionPlugin";

export const permissionClientPlugin = () => {
    return {
        id: "permission-management",
        $InferServerPlugin: {} as ReturnType<typeof permissionManagementPlugin>,
    } satisfies BetterAuthClientPlugin;
}