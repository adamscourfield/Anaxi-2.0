import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { BodyText, MetaText } from "@/components/ui/typography";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="border-dashed border-border/80 bg-bg/25 py-8 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <BodyText className="font-semibold">{title}</BodyText>
        {description ? <MetaText className="mt-1.5">{description}</MetaText> : null}
        {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
      </div>
    </Card>
  );
}
