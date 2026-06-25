import { ArrowLeft, MapPinOff } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="surface flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-slate-100 p-4 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <MapPinOff className="h-7 w-7" />
      </div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
        404
      </p>
      <h1 className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        The page you requested does not exist in this inventory workspace.
      </p>
      <Link className="button-primary mt-6" href="/dashboard">
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>
    </div>
  );
}
