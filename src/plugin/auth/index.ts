import { captchaPlugin } from "./captcha";
import { nextCookiesPlugin } from "./next-cookies";
import { openAPIPlugin } from "./open-api";
import { twoFactorPlugin } from "./two-factor";
import { usernamePlugin } from "./username";
import { roleManagementPlugin } from "@/plugin/role";

export const authPlugins = [
  roleManagementPlugin(),
  usernamePlugin,
  nextCookiesPlugin,
  openAPIPlugin,
  twoFactorPlugin,
  captchaPlugin,
];
