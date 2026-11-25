import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  title = "Nothing to show yet",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-700 dark:bg-signal-night">
      <Inbox aria-hidden="true" className="h-8 w-8 text-slate-400" />
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
