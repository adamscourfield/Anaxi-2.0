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
];

function InboxRow({ r, canAcknowledge, canResolve }: { r: InboxRequest; canAcknowledge?: boolean; canResolve?: boolean }) {
  const router = useRouter();
  const [actionPending, setActionPending] = useState<string | null>(null);
  const showAck = canAcknowledge && r.status === "OPEN";
  const showResolve = canResolve && (r.status === "OPEN" || r.status === "ACKNOWLEDGED");

  async function handleAction(action: string, e: React.MouseEvent) {
    e.stopPropagation();
    setActionPending(action);
    try {
      const res = await fetch(`/api/oncall/${r.id}/${action}`, { method: "POST" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setActionPending(null);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/on-call/${r.id}`)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/on-call/${r.id}`); } }}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-white p-4 shadow-sm calm-transition hover:border-accent/30 hover:shadow-md cursor-pointer sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="hidden sm:block">
        <Avatar name={r.student.fullName} size="md" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-text">{r.student.fullName}</span>
          {r.student.yearGroup && (
            <span className="text-xs text-muted">{r.student.yearGroup}</span>
          )}
          <OnCallStatusBadge status={r.status} />
          <span className="text-xs text-muted sm:hidden">{timeAgo(r.createdAt)}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted">
          {REQUEST_TYPE_LABELS[r.requestType]} · {r.location} · raised by {r.requester.fullName}
        </p>
        {r.responder && (
          <p className="mt-0.5 text-xs text-muted">Responder: {r.responder.fullName}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-2">
        <span className="hidden text-xs font-medium text-muted sm:block">{timeAgo(r.createdAt)}</span>
        {(showAck || showResolve) && (
          <div className="flex items-center gap-2">
            {showAck && (
              <Button
                type="button"
                variant="secondary"
                className="min-h-[36px] px-3 text-xs"
                disabled={actionPending === "acknowledge"}
                onClick={(e) => handleAction("acknowledge", e)}
              >
                {actionPending === "acknowledge" ? "…" : "Acknowledge"}
              </Button>
            )}
            {showResolve && (
              <Button
                type="button"
                variant="secondary"
                className="min-h-[36px] px-3 text-xs"
                disabled={actionPending === "resolve"}
                onClick={(e) => handleAction("resolve", e)}
              >
                {actionPending === "resolve" ? "…" : "Resolve"}
              </Button>
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
