"use client";

import { Turnstile } from "@marsidev/react-turnstile";

interface TurnstileWidgetProps {
  onToken: (token: string) => void;
  onExpire?: () => void;
}

export function TurnstileWidget({ onToken, onExpire }: TurnstileWidgetProps) {
  return (
    <Turnstile
      siteKey={process.env.NEXT_PUBLIC_TRANSTILE_SITE_KEY!}
      onSuccess={onToken}
      onExpire={onExpire}
    />
  );
}
