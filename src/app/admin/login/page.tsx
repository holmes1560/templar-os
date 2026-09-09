"use client";

import { useActionState } from "react";
import { use } from "react";
import { login, type LoginState } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = use(searchParams);
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--os-ground)] px-6">
      <form action={action} className="w-full max-w-[20rem]">
        <div className="mb-8">
          <p className="label mb-2">TEMPLAR OS</p>
          <h1 className="text-lg font-semibold tracking-tight text-[var(--os-fg)]">
            Administration
          </h1>
          <p className="mt-1 text-xs text-[var(--os-fg-faint)]">
            This is the real one, not the portfolio&apos;s lock screen.
          </p>
        </div>

        <input type="hidden" name="next" value={next ?? "/admin"} />

        <label className="label mb-1.5 block" htmlFor="email">email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          className="mb-4 w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 font-mono text-sm text-[var(--os-fg)] outline-none transition-colors focus:border-[var(--os-accent)]"
        />

        <label className="label mb-1.5 block" htmlFor="password">password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 font-mono text-sm text-[var(--os-fg)] outline-none transition-colors focus:border-[var(--os-accent)]"
        />

        {state.error && (
          <p
            role="alert"
            className="mt-4 rounded-[var(--os-r-chip)] border border-[var(--os-crit)]/30 bg-[var(--os-crit)]/[0.08] px-3 py-2 text-xs text-[var(--os-fg)]"
          >
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="pressable mt-5 w-full rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3 py-2.5 text-sm font-medium text-[var(--os-accent-fg)] disabled:opacity-60"
        >
          {pending ? "Checking…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
