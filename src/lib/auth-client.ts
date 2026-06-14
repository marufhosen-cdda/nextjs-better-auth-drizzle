"use client";
import { permissionClientPlugin } from "@/plugin/permission";
import { roleClientPlugin } from "@/plugin/role";
import { organizationClient, twoFactorClient, usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// $InferServerPlugin
export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
    twoFactorClient({
      twoFactorPage: "/sign-in/two-factor",
    }),
    organizationClient(),
    roleClientPlugin(),
    permissionClientPlugin()
  ],
});
