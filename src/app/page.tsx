"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Building2, Check, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const router = useRouter();

  const [slug, setSlug] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ exists: boolean; name?: string } | null>(null);
  const [pending, setPending] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trimmed = slug.trim().toLowerCase();

    setResult(null);

    if (!trimmed) {
      setChecking(false);
      return;
    }

    setChecking(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const { data } = await authClient.orgLookup.check({
        query: { slug: trimmed },
      });

      setChecking(false);
      setResult(
        data
          ? { exists: data.exists, name: data.organization?.name }
          : { exists: false },
      );
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [slug]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!result?.exists) return;

    setPending(true);
    router.push(`/sign-in?org=${encodeURIComponent(slug.trim().toLowerCase())}`);
  }

  const showAvailable = !checking && result?.exists === true;
  const showNotFound = !checking && result?.exists === false && slug.trim().length > 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Find your organization</CardTitle>
          <CardDescription>
            Enter your organization slug to get started.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-slug">Organization slug</Label>
              <div className="relative">
                <Input
                  id="org-slug"
                  placeholder="acme-inc"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  autoFocus
                  autoComplete="off"
                  className="pr-9"
                />
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  {checking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {showAvailable && <Check className="h-4 w-4 text-green-500" />}
                  {showNotFound && <X className="h-4 w-4 text-destructive" />}
                </div>
              </div>

              {showAvailable && (
                <p className="text-xs text-green-600">
                  Found <span className="font-medium">{result?.name}</span>
                </p>
              )}
              {showNotFound && (
                <p className="text-xs text-destructive">
                  No organization found with that slug.
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={!showAvailable || pending}
            >
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting…
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
