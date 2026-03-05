import { getSessionUserOrThrow } from "@/lib/auth";
import { requireFeature } from "@/lib/guards";
import { getMyActions, getOverdueActions } from "@/modules/actions/service";
import { MyActionsGrouped } from "@/components/actions/MyActionsGrouped";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default async function MyActionsPage() {
  const user = await getSessionUserOrThrow();
  await requireFeature(user.tenantId, "MEETINGS");

  const [grouped, overdueCount] = await Promise.all([
    getMyActions(user.tenantId, user.id),
    getOverdueActions(user.tenantId, user.id),
  ]);

  const openCount = grouped.OPEN?.length ?? 0;
  const blockedCount = grouped.BLOCKED?.length ?? 0;
  const doneCount = grouped.DONE?.length ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="My actions"
        subtitle="Stay on top of meeting follow-ups and deadlines."
        actions={
          <Link href="/tenant/meetings" className="rounded-md border border-border/80 px-3 py-1.5 text-sm text-muted hover:bg-divider/60 hover:text-text">
            Meetings
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Open", value: openCount, tone: "text-text" },
          { label: "Blocked", value: blockedCount, tone: "text-warning" },
          { label: "Done", value: doneCount, tone: "text-success" },
        ].map((item) => (
          <Card key={item.label} className="p-3 text-center">
            <p className={`text-2xl font-semibold ${item.value > 0 ? item.tone : "text-muted"}`}>{item.value}</p>
            <p className="text-xs uppercase tracking-[0.06em] text-muted">{item.label}</p>
          </Card>
        ))}
      </div>

      {overdueCount > 0 && (
        <div className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          You have <strong>{overdueCount}</strong> overdue action{overdueCount !== 1 ? "s" : ""}.
        </div>
      )}

      <MyActionsGrouped grouped={grouped as any} currentUserId={user.id} />
    </div>
  );
}
