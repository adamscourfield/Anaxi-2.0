"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnCallStatusBadge } from "./OnCallStatusBadge";
import { REQUEST_TYPE_LABELS, STATUS_LABELS } from "@/modules/oncall/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";

type Status = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "CANCELLED";

interface InboxRequest {
  id: string;
  requestType: "BEHAVIOUR" | "FIRST_AID";
  location: string;
  status: Status;
  createdAt: Date | string;
  requester: { fullName: string };
  student: { fullName: string; yearGroup?: string | null };
  responder?: { fullName: string } | null;
}

interface OnCallInboxProps {
  requests: InboxRequest[];
  canAcknowledge?: boolean;
  canResolve?: boolean;
}

function timeAgo(dateVal: Date | string): string {
  const ms = Date.now() - new Date(dateVal).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "ACKNOWLEDGED", label: "Acknowledged" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "CANCELLED", label: "Cancelled" },
];

function InboxRow({ r, canAcknowledge, canResolve }: { r: InboxRequest; canAcknowledge?: boolean; canResolve?: boolean }) {
  const router = useRouter();
  const showAck = canAcknowledge && r.status === "OPEN";
  const showResolve = canResolve && (r.status === "OPEN" || r.status === "ACKNOWLEDGED");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/on-call/${r.id}`)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/on-call/${r.id}`); } }}
      className="group flex items-center gap-4 rounded-xl border border-border bg-white p-4 shadow-sm calm-transition hover:border-accent/30 hover:shadow-md cursor-pointer"
    >
      <Avatar name={r.student.fullName} size="md" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-text">{r.student.fullName}</span>
          {r.student.yearGroup && (
            <span className="text-xs text-muted">{r.student.yearGroup}</span>
          )}
          <OnCallStatusBadge status={r.status} />
        </div>
        <p className="mt-0.5 text-xs text-muted">
          {REQUEST_TYPE_LABELS[r.requestType]} · {r.location} · raised by {r.requester.fullName}
        </p>
        {r.responder && (
          <p className="mt-0.5 text-xs text-muted">Responder: {r.responder.fullName}</p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="text-xs font-medium text-muted">{timeAgo(r.createdAt)}</span>
        {(showAck || showResolve) && (
          <div className="flex items-center gap-2">
            {showAck && (
              <form method="POST" action={`/api/oncall/${r.id}/acknowledge`} onClick={(e) => e.stopPropagation()}>
                <Button type="submit" className="px-3 py-1.5 text-xs">Acknowledge</Button>
              </form>
            )}
            {showResolve && (
              <form method="POST" action={`/api/oncall/${r.id}/resolve`} onClick={(e) => e.stopPropagation()}>
                <Button type="submit" variant="secondary" className="px-3 py-1.5 text-xs">Resolve</Button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function OnCallInbox({ requests, canAcknowledge, canResolve }: OnCallInboxProps) {
  const [statusFilter, setStatusFilter] = useState<string>("");

  const counts: Record<string, number> = { "": requests.length };
  for (const r of requests) {
    counts[r.status] = (counts[r.status] || 0) + 1;
  }

  const filtered = statusFilter
    ? requests.filter((r) => r.status === statusFilter)
    : requests;

  const tabs = STATUS_TABS.map((t) => ({ ...t, count: counts[t.key] ?? 0 }));

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <SegmentedTabs tabs={tabs} activeKey={statusFilter} onChange={setStatusFilter} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No requests found"
          description={statusFilter ? `No ${STATUS_LABELS[statusFilter as Status]?.toLowerCase()} requests right now.` : "No on-call requests yet."}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <InboxRow key={r.id} r={r} canAcknowledge={canAcknowledge} canResolve={canResolve} />
          ))}
        </div>
      )}
    </div>
  );
}
