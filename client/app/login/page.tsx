"use client";

import { useInventoryAuth } from "@/app/auth";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const { signIn } = useInventoryAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await signIn(email, password);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form className="surface w-full max-w-sm p-6" onSubmit={handleSubmit}>
        <h1 className="text-xl font-bold text-slate-950 dark:text-white">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Use the account created from your invite.
        </p>

        {error ? (
          <div className="mt-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}

        <label className="mt-5 block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Email
          </span>
          <input
            autoComplete="email"
            className="field"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Password
          </span>
          <input
            autoComplete="current-password"
            className="field"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        <button className="button-primary mt-5 w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>

        <Link
          className="mt-4 block text-center text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          href="/forgot-password"
        >
          Forgot password?
        </Link>
      </form>
    </div>
  );
}
