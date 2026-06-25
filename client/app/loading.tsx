export default function Loading() {
  return (
    <div className="space-y-5" aria-label="Loading page" role="status">
      <div className="h-14 w-full max-w-md animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            key={item}
          />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
    </div>
  );
}
