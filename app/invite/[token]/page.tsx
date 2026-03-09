import { createHash } from "crypto";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export default async function InviteAcceptPage({ params }: { params: { token: string } }) {
  const invite = await (prisma as any).schoolAdminInvite.findUnique({
    where: { tokenHash: hashToken(params.token) },
    include: { tenant: true },
  });

  if (!invite) notFound();

  const expired = invite.acceptedAt || new Date(invite.expiresAt).getTime() < Date.now();

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-lg border border-border bg-surface p-6">
      <h1 className="text-2xl font-semibold">School admin invite</h1>
      <p className="text-sm text-muted">{invite.fullName} · {invite.email} · {invite.tenant.name}</p>

      {expired ? (
        <p className="text-sm text-red-600">This invite is expired or already used.</p>
      ) : (
        <form method="post" action="/api/invite/accept" className="space-y-3">
          <input type="hidden" name="token" value={params.token} />
          <label className="block text-sm">Set password
            <input type="password" name="password" required className="mt-1 w-full rounded border border-border bg-bg px-3 py-2" />
          </label>
          <button className="rounded bg-primaryBtn px-4 py-2 text-sm text-white">Accept invite</button>
        </form>
      )}
    </div>
  );
}
