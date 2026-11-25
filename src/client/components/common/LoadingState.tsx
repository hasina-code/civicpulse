import { LoaderCircle } from "lucide-react";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div
      aria-live="polite"
      className="flex min-h-40 flex-col items-center justify-center gap-3 text-slate-600 dark:text-slate-300"
      role="status"
    >
      <LoaderCircle
        aria-hidden="true"
        className="h-7 w-7 animate-spin text-signal-blue"
      />
      <span>{label}</span>
    </div>
  );
}
