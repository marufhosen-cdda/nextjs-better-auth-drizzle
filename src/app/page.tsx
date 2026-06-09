import { AuthPanel } from "@/components/auth-panel";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12">
      <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[1fr_28rem] lg:items-center">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
            Better Auth + Drizzle + D1
          </p>
          <h1 className="max-w-xl text-4xl font-semibold text-zinc-950 sm:text-5xl">
            Email and password auth backed by Cloudflare D1.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-zinc-600">
            Create an account, sign in, and Better Auth will store users,
            sessions, accounts, and verification records through Drizzle.
          </p>
        </div>
        <AuthPanel />
      </div>
    </main>
  );
}
