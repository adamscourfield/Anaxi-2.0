import Link from "next/link";
import { getSessionUserOrThrow } from "@/lib/auth";
import { requireFeature } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { OnCallRequestForm } from "@/components/oncall/OnCallRequestForm";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default async function OnCallNewPage() {
  const user = await getSessionUserOrThrow();
  await requireFeature(user.tenantId, "ON_CALL");

  const students = await (prisma as any).student.findMany({
    where: { tenantId: user.tenantId, status: "ACTIVE" },
    orderBy: { fullName: "asc" },
    take: 500,
    select: { id: true, fullName: true, upn: true, yearGroup: true },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="New on call request"
        subtitle="Designed for fast submission — under 15 seconds."
        actions={
          <Link href="/on-call">
            <Button variant="secondary">Cancel</Button>
          </Link>
        }
      />
      <OnCallRequestForm students={students} />
    </div>
  );
}
