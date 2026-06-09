"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectIfAuth?: string;
  redirectIfNotAuth?: string;
}

export function AuthGuard({ children, redirectIfAuth, redirectIfNotAuth }: AuthGuardProps) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;
    if (session && redirectIfAuth) router.replace(redirectIfAuth);
    if (!session && redirectIfNotAuth) router.replace(redirectIfNotAuth);
  }, [session, isPending, router, redirectIfAuth, redirectIfNotAuth]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </div>
    );
  }

  if (redirectIfAuth && session) return null;
  if (redirectIfNotAuth && !session) return null;

  return <>{children}</>;
}
