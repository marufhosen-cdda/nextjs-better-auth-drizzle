import { captchaPlugin } from "./captcha";
import { nextCookiesPlugin } from "./next-cookies";
import { openAPIPlugin } from "./open-api";
import { twoFactorPlugin } from "./two-factor";
import { usernamePlugin } from "./username";
import { roleManagementPlugin } from "@/plugin/role";
import { permissionManagementPlugin } from "@/plugin/permission";

export const authPlugins = [
  roleManagementPlugin(),
  permissionManagementPlugin(),
  usernamePlugin,
  nextCookiesPlugin,
  openAPIPlugin,
  twoFactorPlugin,
  captchaPlugin,
];
