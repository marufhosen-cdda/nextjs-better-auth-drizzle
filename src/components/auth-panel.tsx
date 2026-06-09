"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type Mode = "sign-in" | "sign-up";

export function AuthPanel() {
  const { data: session, isPending, refetch } = authClient.useSession();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setMessage("");

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    if (mode === "sign-up") {
      const name = String(formData.get("name") ?? "");
      const username = String(formData.get("username") ?? "");
      const { error } = await authClient.signUp.email({
        email,
        password,
        name,
        username: username || undefined,
      });

      if (error) {
        setMessage(error.message ?? "Sign-up failed.");
      } else {
        setMessage("Account created. You are signed in.");
        await refetch();
      }
    } else {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        setMessage(error.message ?? "Sign-in failed.");
      } else {
        setMessage("Signed in.");
        await refetch();
      }
    }

    setPending(false);
  }

  async function signOut() {
    setPending(true);
    await authClient.signOut();
    await refetch();
    setMessage("Signed out.");
    setPending(false);
  }

  if (isPending) {
    return (
      <section className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-600">Loading session...</p>
      </section>
    );
  }

  if (session) {
    return (
      <section className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <p className="text-sm font-medium text-zinc-500">Signed in as</p>
          <h1 className="text-2xl font-semibold text-zinc-950">
            {session.user.name}
          </h1>
          <p className="text-sm text-zinc-600">{session.user.email}</p>
        </div>
        <button
          className="mt-6 h-11 w-full rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          onClick={signOut}
          type="button"
        >
          Sign out
        </button>
        {message ? (
          <p className="mt-4 text-sm text-zinc-600">{message}</p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-2 rounded-md bg-zinc-100 p-1">
        <button
          className={`h-10 rounded px-3 text-sm font-medium transition ${
            mode === "sign-in"
              ? "bg-white text-zinc-950 shadow-sm"
              : "text-zinc-600 hover:text-zinc-950"
          }`}
          onClick={() => setMode("sign-in")}
          type="button"
        >
          Sign in
        </button>
        <button
          className={`h-10 rounded px-3 text-sm font-medium transition ${
            mode === "sign-up"
              ? "bg-white text-zinc-950 shadow-sm"
              : "text-zinc-600 hover:text-zinc-950"
          }`}
          onClick={() => setMode("sign-up")}
          type="button"
        >
          Sign up
        </button>
      </div>

      <form action={handleSubmit} className="mt-6 space-y-4">
        {mode === "sign-up" ? (
          <>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-zinc-700">Name</span>
              <input
                className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-zinc-950"
                name="name"
                required
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-zinc-700">
                Username
              </span>
              <input
                className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-zinc-950"
                name="username"
              />
            </label>
          </>
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700">Email</span>
          <input
            className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-zinc-950"
            name="email"
            required
            type="email"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700">Password</span>
          <input
            className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-zinc-950"
            minLength={8}
            name="password"
            required
            type="password"
          />
        </label>

        <button
          className="h-11 w-full rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Working..." : mode === "sign-in" ? "Sign in" : "Sign up"}
        </button>

        {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
      </form>
    </section>
  );
}
