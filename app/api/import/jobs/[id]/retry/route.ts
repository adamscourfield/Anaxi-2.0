import { NextResponse } from "next/server";
import { getSessionUserOrThrow } from "@/lib/auth";
import { requireFeature } from "@/lib/guards";
import { hasPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUserOrThrow();
  await requireFeature(user.tenantId, "STUDENTS_IMPORT");
  if (!hasPermission(user.role, "import:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const original = await (prisma as any).importJob.findFirst({
    where: { id: params.id, tenantId: user.tenantId },
  });
  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (original.status !== "FAILED") {
    return NextResponse.json({ error: "Only failed jobs can be retried" }, { status: 400 });
  }

  const newJob = await (prisma as any).importJob.create({
    data: {
      tenantId: user.tenantId,
      type: original.type,
      status: "PENDING",
      uploadedBy: user.id,
      fileName: original.fileName,
      rowCount: 0,
    },
  });

  return NextResponse.json({ jobId: newJob.id, status: newJob.status });
}
