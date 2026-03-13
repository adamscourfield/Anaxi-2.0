import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OnCallStatusBadge } from "./OnCallStatusBadge";
import { REQUEST_TYPE_LABELS } from "@/modules/oncall/types";

interface OnCallDetailProps {
  request: {
    id: string;
    requestType: "BEHAVIOUR" | "FIRST_AID";
    location: string;
    behaviourReasonCategory?: string | null;
    notes?: string | null;
    status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "CANCELLED";
    createdAt: Date | string;
    acknowledgedAt?: Date | string | null;
    resolvedAt?: Date | string | null;
    requester: { fullName: string; email: string };
    student: { fullName: string; upn: string; yearGroup?: string | null };
    responder?: { fullName: string } | null;
  };
  canAcknowledge?: boolean;
  canResolve?: boolean;
  canCancel?: boolean;
}

function fmt(d?: Date | string | null) {
  if (!d) return null;
  return new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-sm text-text">{value}</dd>
    </>
  );
}

export function OnCallDetail({ request, canAcknowledge, canResolve, canCancel }: OnCallDetailProps) {
  const showActions =
    (canAcknowledge && request.status === "OPEN") ||
    (canResolve && (request.status === "OPEN" || request.status === "ACKNOWLEDGED")) ||
    (canCancel && request.status === "OPEN");

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <OnCallStatusBadge status={request.status} />
        <span className="text-sm font-medium text-text">{REQUEST_TYPE_LABELS[request.requestType]}</span>
      </div>

      <Card className="space-y-0">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
          <DetailRow label="Student" value={`${request.student.fullName} (${request.student.upn})`} />
          <DetailRow label="Year group" value={request.student.yearGroup ?? "—"} />
          <DetailRow label="Type" value={REQUEST_TYPE_LABELS[request.requestType]} />
          <DetailRow label="Location" value={request.location} />
          <DetailRow label="Reason" value={request.behaviourReasonCategory} />
          <DetailRow label="Notes" value={request.notes} />
          <DetailRow label="Raised by" value={request.requester.fullName} />
          {request.responder && <DetailRow label="Responder" value={request.responder.fullName} />}
        </dl>
      </Card>

      <Card tone="subtle" className="space-y-0">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Timeline</h2>
        <ol className="space-y-3 border-l-2 border-divider pl-4">
          <li className="space-y-0.5">
            <p className="text-sm font-medium text-text">Created</p>
            <p className="text-xs text-muted">{fmt(request.createdAt)}</p>
          </li>
          {request.acknowledgedAt && (
            <li className="space-y-0.5">
              <p className="text-sm font-medium text-text">Acknowledged</p>
              <p className="text-xs text-muted">
                {fmt(request.acknowledgedAt)}
                {request.responder ? ` by ${request.responder.fullName}` : ""}
              </p>
            </li>
          )}
          {request.resolvedAt && (
            <li className="space-y-0.5">
              <p className="text-sm font-medium text-text">Resolved</p>
              <p className="text-xs text-muted">
                {fmt(request.resolvedAt)}
                {request.responder ? ` by ${request.responder.fullName}` : ""}
              </p>
            </li>
          )}
        </ol>
      </Card>

      {showActions && (
        <div className="flex flex-wrap gap-3">
          {canAcknowledge && request.status === "OPEN" && (
            <form method="POST" action={`/api/oncall/${request.id}/acknowledge`}>
              <Button type="submit">Acknowledge</Button>
            </form>
          )}
          {canResolve && (request.status === "OPEN" || request.status === "ACKNOWLEDGED") && (
            <form method="POST" action={`/api/oncall/${request.id}/resolve`}>
              <Button type="submit" variant="secondary">Resolve</Button>
            </form>
          )}
          {canCancel && request.status === "OPEN" && (
            <form method="POST" action={`/api/oncall/${request.id}/cancel`}>
              <Button type="submit" variant="ghost">Cancel request</Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
