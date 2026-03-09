import { requireSuperAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export default async function GodAuditPage() {
  await requireSuperAdminUser();

  const rows = await (prisma as any).auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      tenant: { select: { name: true } },
      actor: { select: { fullName: true, email: true } },
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">God audit log</h1>
      <div className="overflow-auto rounded-lg border border-border bg-surface">
        <table className="min-w-full text-sm">
          <thead className="bg-bg text-left text-xs text-muted">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">School</th>
              <th className="px-3 py-2">Target</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2">{new Date(r.createdAt).toLocaleString("en-GB")}</td>
                <td className="px-3 py-2">{r.actor?.fullName ?? r.actor?.email ?? "—"}</td>
                <td className="px-3 py-2">{r.action}</td>
                <td className="px-3 py-2">{r.tenant?.name ?? "platform"}</td>
                <td className="px-3 py-2">{r.targetType}{r.targetId ? `:${r.targetId}` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
