"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, ShieldCheck, ShieldOff, Copy, CheckCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

type Step = "idle" | "password" | "qr" | "verify" | "backup-codes" | "disable";

type UserWithTwoFactor = {
  id: string;
  name: string;
  email: string;
  username?: string;
  twoFactorEnabled?: boolean;
};

export default function SettingsPage() {
  const { data, refetch } = authClient.useSession();
  const user = data?.user as UserWithTwoFactor | undefined;

  const [step, setStep] = useState<Step>("idle");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [totpURI, setTotpURI] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const is2FAEnabled = user.twoFactorEnabled ?? false;

  function resetState() {
    setStep("idle");
    setPending(false);
    setError("");
    setTotpURI("");
    setBackupCodes([]);
  }

  async function handleEnable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");

    const { data, error } = await authClient.twoFactor.enable({ password } as Parameters<typeof authClient.twoFactor.enable>[0]);

    if (error) {
      setError(error.message ?? "Failed to enable 2FA.");
      setPending(false);
      return;
    }

    if (data) {
      setTotpURI((data as { totpURI: string }).totpURI ?? "");
      setBackupCodes((data as { backupCodes: string[] }).backupCodes ?? []);
    }

    setPending(false);
    setStep("qr");
  }

  async function handleVerifyTotp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const code = String(form.get("code") ?? "");

    const { error } = await authClient.twoFactor.verifyTotp({ code });

    if (error) {
      setError(error.message ?? "Invalid code.");
      setPending(false);
      return;
    }

    await refetch();
    setPending(false);
    setStep("backup-codes");
  }

  async function handleDisable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");

    const { error } = await authClient.twoFactor.disable({ password } as Parameters<typeof authClient.twoFactor.disable>[0]);

    if (error) {
      setError(error.message ?? "Failed to disable 2FA.");
      setPending(false);
      return;
    }

    await refetch();
    setPending(false);
    resetState();
  }

  async function copyBackupCodes() {
    await navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <Link href="/dashboard" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Dashboard
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-semibold">Settings</h1>

      {/* Profile card */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Name</span>
            <span>{user.name}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{user.email}</span>
          </div>
          {(user as { username?: string }).username && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Username</span>
                <span>@{(user as { username?: string }).username}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 2FA card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Two-factor authentication</CardTitle>
              <CardDescription className="mt-1">
                Add an extra layer of security to your account using an authenticator app.
              </CardDescription>
            </div>
            {is2FAEnabled ? (
              <Badge variant="default" className="gap-1 shrink-0">
                <ShieldCheck className="h-3 w-3" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 shrink-0">
                <ShieldOff className="h-3 w-3" />
                Disabled
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {is2FAEnabled ? (
            <Button variant="destructive" size="sm" onClick={() => setStep("disable")}>
              Disable two-factor auth
            </Button>
          ) : (
            <Button size="sm" onClick={() => setStep("password")}>
              Enable two-factor auth
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Enable: password dialog */}
      <Dialog open={step === "password"} onOpenChange={(o) => !o && resetState()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm your password</DialogTitle>
            <DialogDescription>
              Enter your current password to begin setting up two-factor authentication.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEnable} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="enable-password">Password</Label>
              <Input
                id="enable-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetState}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Continuing…" : "Continue"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enable: QR code dialog */}
      <Dialog open={step === "qr"} onOpenChange={(o) => !o && resetState()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan the QR code</DialogTitle>
            <DialogDescription>
              Open your authenticator app (Google Authenticator, Authy, etc.) and scan the code below.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            {totpURI && (
              <div className="rounded-lg border bg-white p-4">
                <QRCodeSVG value={totpURI} size={180} />
              </div>
            )}
            <p className="max-w-xs break-all text-center text-xs text-muted-foreground">{totpURI}</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetState}>
              Cancel
            </Button>
            <Button onClick={() => setStep("verify")}>I&apos;ve scanned it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enable: verify TOTP dialog */}
      <Dialog open={step === "verify"} onOpenChange={(o) => !o && resetState()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify your authenticator</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code from your authenticator app to confirm setup.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVerifyTotp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verify-code">Authenticator code</Label>
              <Input
                id="verify-code"
                name="code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                required
                autoComplete="one-time-code"
                className="tracking-widest text-center text-lg"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep("qr")}>
                Back
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Verifying…" : "Verify & enable"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enable: backup codes dialog */}
      <Dialog open={step === "backup-codes"} onOpenChange={(o) => !o && resetState()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save your backup codes</DialogTitle>
            <DialogDescription>
              Store these codes somewhere safe. Each code can be used once if you lose access to your authenticator.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted p-4 font-mono text-sm">
            <div className="grid grid-cols-2 gap-1">
              {backupCodes.map((code) => (
                <span key={code}>{code}</span>
              ))}
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" className="gap-2" onClick={copyBackupCodes}>
              {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy codes"}
            </Button>
            <Button onClick={resetState}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA dialog */}
      <Dialog open={step === "disable"} onOpenChange={(o) => !o && resetState()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable two-factor authentication</DialogTitle>
            <DialogDescription>
              Enter your password to disable 2FA. Your account will be less secure without it.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDisable} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disable-password">Password</Label>
              <Input
                id="disable-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetState}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={pending}>
                {pending ? "Disabling…" : "Disable 2FA"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
