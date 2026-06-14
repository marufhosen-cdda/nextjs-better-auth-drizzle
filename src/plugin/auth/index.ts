import { permissionManagementPlugin } from "@/plugin/permission";
import { roleManagementPlugin } from "@/plugin/role";
import { organization } from "better-auth/plugins";
import { captchaPlugin } from "./captcha";
import { nextCookiesPlugin } from "./next-cookies";
import { openAPIPlugin } from "./open-api";
import { twoFactorPlugin } from "./two-factor";
import { usernamePlugin } from "./username";

export const authPlugins = [
  roleManagementPlugin(),
  permissionManagementPlugin(),
  organization({
    allowUserToCreateOrganization: async (user) => {
      return user?.role === "ADMIN";
    },
    schema: {
      organization: {
        additionalFields: {
          domain: {
            type: "string",
            required: false,
            unique: true,
          },
          tenantType: {
            type: "string",
            required: false,
            default: "DOMAIN",
            choices: ["DOMAIN", "SUBDOMAIN", "DIRECTORY"],
          },
        },
      },
    },
  }),
  usernamePlugin,
  nextCookiesPlugin,
  openAPIPlugin,
  twoFactorPlugin,
  captchaPlugin,
];
