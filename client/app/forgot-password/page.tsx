"use client";

import { useInventoryAuth } from "@/app/auth";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useInventoryAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setResetLink("");
    try {
      const result = await forgotPassword(email);
      setMessage("If the account exists, a reset link has been generated.");
      setResetLink(result.resetLink ?? "");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form className="surface w-full max-w-sm p-6" onSubmit={handleSubmit}>
        <h1 className="text-xl font-bold text-slate-950 dark:text-white">
          Reset password
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Enter your email to generate a reset link.
        </p>

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

        <button className="button-primary mt-5 w-full" disabled={isSubmitting}>
          {isSubmitting ? "Generating..." : "Generate reset link"}
        </button>

        {message ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
            <p>{message}</p>
            {resetLink ? (
              <a className="mt-2 block break-all font-medium underline" href={resetLink}>
                {resetLink}
              </a>
            ) : null}
          </div>
        ) : null}

        <Link
          className="mt-4 block text-center text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          href="/login"
        >
          Back to sign in
        </Link>
      </form>
    </div>
  );
}
