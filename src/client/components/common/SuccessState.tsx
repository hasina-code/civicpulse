import { CircleCheck } from "lucide-react";
import type { ReactNode } from "react";

export function SuccessState({
  title = "Completed successfully",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      aria-live="polite"
      className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-emerald-200 bg-white p-6 text-center dark:border-emerald-900 dark:bg-signal-night"
      role="status"
    >
      <CircleCheck aria-hidden="true" className="h-8 w-8 text-emerald-600" />
      <h2 className="text-lg font-semibold text-signal-navy dark:text-signal-cream">
        {title}
      </h2>
      {description ? (
        <p className="max-w-lg text-slate-600 dark:text-slate-300">
          {description}
        </p>
      ) : null}
      {action}
    </div>
  );
}
