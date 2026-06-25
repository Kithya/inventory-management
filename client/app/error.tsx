"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="surface flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-red-50 p-4 text-red-600 dark:bg-red-950/60 dark:text-red-400">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-xl font-bold text-slate-950 dark:text-white">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        The page encountered an unexpected error. Try loading it again.
      </p>
      <button className="button-primary mt-6" onClick={unstable_retry}>
        <RotateCcw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}
