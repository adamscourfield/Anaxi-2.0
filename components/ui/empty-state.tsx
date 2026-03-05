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
    <Card className="border-dashed border-border/80 bg-bg/25 py-7 text-center">
      <BodyText className="font-medium">{title}</BodyText>
      {description ? <MetaText className="mt-1">{description}</MetaText> : null}
      {action ? <div className="mt-3 flex justify-center">{action}</div> : null}
    </Card>
  );
}
