import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/lib/types";
import { CpdPriorityRow, computeCpdPriorities } from "@/modules/analysis/cpdPriorities";
import { computeTeacherSignalProfile } from "@/modules/analysis/teacherRisk";
import { HomeAssembly } from "@/modules/home/assembler";

export async function hydrateTeacherHomeData({
  user,
  windowDays,
  hasAnalysisFeature,
  assembly,
}: {
  user: SessionUser;
  windowDays: number;
  hasAnalysisFeature: boolean;
  assembly: HomeAssembly;
}) {
  const selfProfilePromise =
    hasAnalysisFeature && assembly.has("observe.my-observation-profile")
      ? computeTeacherSignalProfile(user.tenantId, user.id, windowDays)
      : Promise.resolve(null);

  const wholeSchoolCpdPromise =
    hasAnalysisFeature && assembly.has("observe.whole-school-focus")
      ? computeCpdPriorities(user.tenantId, windowDays)
      : Promise.resolve([] as CpdPriorityRow[]);

  const loaDataPromise = assembly.has("operations.my-leave-status")
    ? (prisma as any).lOARequest.findFirst({
        where: { tenantId: user.tenantId, requesterId: user.id },
        orderBy: { createdAt: "desc" },
      })
    : Promise.resolve(null);

  const onCallDataPromise = assembly.has("culture.my-oncall-status")
    ? (prisma as any).onCallRequest.findMany({
        where: { tenantId: user.tenantId, requesterUserId: user.id },
        orderBy: { createdAt: "desc" },
        take: 3,
      })
    : Promise.resolve([] as any[]);

  const openActionsDataPromise = assembly.has("operations.my-open-actions")
    ? (prisma as any).meetingAction.findMany({
        where: { tenantId: user.tenantId, ownerUserId: user.id, status: "OPEN" },
        orderBy: [{ dueDate: "asc" }],
        take: 5,
      })
    : Promise.resolve([] as any[]);

  const [selfProfile, wholeSchoolCpd, loaData, onCallData, openActionsData] = await Promise.all([
    selfProfilePromise,
    wholeSchoolCpdPromise,
    loaDataPromise,
    onCallDataPromise,
    openActionsDataPromise,
  ]);

  const wholeSchoolTop1 = (wholeSchoolCpd as CpdPriorityRow[]).find((r) => r.teachersDriftingDown > 0) ?? null;

  return {
    selfProfile,
    wholeSchoolTop1,
    loaData,
    onCallData,
    openActionsData,
  };
}
