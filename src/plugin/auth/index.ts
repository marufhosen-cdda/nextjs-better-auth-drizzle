import { captchaPlugin } from "./captcha";
import { nextCookiesPlugin } from "./next-cookies";
import { openAPIPlugin } from "./open-api";
import { twoFactorPlugin } from "./two-factor";
import { usernamePlugin } from "./username";

export const authPlugins = [
  usernamePlugin,
  nextCookiesPlugin,
  openAPIPlugin,
  twoFactorPlugin,
  captchaPlugin,
];
