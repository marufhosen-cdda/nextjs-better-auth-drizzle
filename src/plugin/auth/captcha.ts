import { captcha } from "better-auth/plugins";

export const captchaPlugin = captcha({
  provider: "cloudflare-turnstile",
  secretKey: process.env.TRANSTILE_SECRET_KEY as string,
});
