"use client";

import { LoadingState } from "@/app/(components)/ui";
import { useInventoryAuth } from "@/app/auth";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { acceptInvite } = useInventoryAuth();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await acceptInvite({ token, name, password });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to accept invite.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form className="surface w-full max-w-sm p-6" onSubmit={handleSubmit}>
        <h1 className="text-xl font-bold text-slate-950 dark:text-white">
          Accept invite
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Set your name and password to join the workspace.
        </p>

        {!token ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
            Invite token is missing.
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}

        <label className="mt-5 block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Name
          </span>
          <input
            autoComplete="name"
            className="field"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Password
          </span>
          <input
            autoComplete="new-password"
            className="field"
            minLength={10}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
            At least 10 characters, with a letter and a number.
          </span>
        </label>

        <button
          className="button-primary mt-5 w-full"
          disabled={isSubmitting || !token}
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>

        <Link
          className="mt-4 block text-center text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          href="/login"
        >
          Already accepted?
        </Link>
      </form>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading invite" />}>
      <AcceptInviteContent />
    </Suspense>
  );
}
