import { ReactNode } from "react";
import { H1, MetaText } from "@/components/ui/typography";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1.5">
        <H1>{title}</H1>
        {subtitle ? <MetaText className="max-w-3xl">{subtitle}</MetaText> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
