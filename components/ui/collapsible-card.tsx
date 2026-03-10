import { ReactNode } from "react";

export function CollapsibleCard({
  title,
  children,
  defaultOpen = true,
  className = "",
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  return (
    <details
      className={[
        "group h-full overflow-hidden rounded-lg border border-border/80 bg-surface/95 shadow-sm calm-transition",
        "hover:border-border hover:shadow-md",
        className,
      ].join(" ")}
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-transparent px-4 py-3 text-sm font-semibold text-text calm-transition group-open:border-border/80">
        <span>{title}</span>
        <span className="text-muted calm-transition group-open:rotate-180">⌄</span>
      </summary>
      <div className="p-4">{children}</div>
    </details>
  );
}
