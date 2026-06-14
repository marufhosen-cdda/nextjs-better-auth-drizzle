"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { ShieldCheck, ShieldOff } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: sessionData } = authClient.useSession();
  const user = sessionData?.user as {
    id: string;
    name: string;
    email: string;
    username?: string;
    twoFactorEnabled?: boolean;
    role?: string;
  } | undefined;

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="px-6 py-8">
      <h1 className="mb-8 text-2xl font-semibold">Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">Your account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <p className="text-lg font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-xs">{user.id}</span>
            </div>
            {user.username && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Username</span>
                <span>@{user.username}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Two-factor auth</span>
              {user.twoFactorEnabled ? (
                <Badge variant="default" className="gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Enabled
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <ShieldOff className="h-3 w-3" />
                  Disabled
                </Badge>
              )}
            </div>
          </div>

          {!user.twoFactorEnabled && (
            <>
              <Separator />
              <div className="rounded-lg bg-muted p-4 text-sm">
                <p className="font-medium">Protect your account</p>
                <p className="mt-1 text-muted-foreground">
                  Enable two-factor authentication in{" "}
                  <Link href="/settings" className="underline underline-offset-4">
                    Settings
                  </Link>{" "}
                  for an extra layer of security.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
