import { NextResponse } from "next/server";
import { getSessionUserOrThrow } from "@/lib/auth";
import { hasOnCallPermission } from "@/lib/rbac";
import { deleteOnCallRequest } from "@/modules/oncall/service";
import { apiErrorResponse } from "@/lib/apiErrors";

// On Call is never gated behind a tenant feature flag -- see on-call/page.tsx.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const user = await getSessionUserOrThrow();
    if (!hasOnCallPermission(user.role, "oncall:delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteOnCallRequest(resolvedParams.id, user.tenantId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
