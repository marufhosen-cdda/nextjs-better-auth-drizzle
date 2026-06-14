import { BetterAuthClientPlugin } from "better-auth";
import { roleManagementPlugin } from "./roleManagementPlugin";

export const roleClientPlugin = () => {
    return {
        id: "role-management",
        $InferServerPlugin: {} as ReturnType<typeof roleManagementPlugin>,
    } satisfies BetterAuthClientPlugin;
}