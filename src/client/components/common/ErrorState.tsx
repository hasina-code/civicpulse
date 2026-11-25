import { AlertCircle } from "lucide-react";

export function ErrorState({
  message = "We couldn't load this information.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      aria-live="assertive"
      className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-white p-6 text-center dark:border-red-900 dark:bg-signal-night"
      role="alert"
    >
      <AlertCircle aria-hidden="true" className="h-7 w-7 text-red-600" />
      <p className="max-w-lg text-slate-700 dark:text-slate-200">{message}</p>
      {onRetry ? (
        <button
          className="font-semibold text-signal-blue underline-offset-4 hover:underline"
          onClick={onRetry}
          type="button"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
