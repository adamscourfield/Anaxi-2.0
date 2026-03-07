import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/lib/types";
import {
  CpdPriorityRow,
  computeCpdPriorities,
  getTopImprovingSignals,
} from "@/modules/analysis/cpdPriorities";
import {
  computeTeacherRiskIndex,
  computeTeacherSignalProfile,
  TeacherRiskRow,
} from "@/modules/analysis/teacherRisk";
import { computeCohortPivot } from "@/modules/analysis/cohortPivot";
import { computeStudentRiskIndex } from "@/modules/analysis/studentRisk";
import { HomeAssembly } from "@/modules/home/assembler";

export async function hydrateLeadershipHomeData({
  user,
  windowDays,
}: {
  user: SessionUser;
  windowDays: number;
}) {
  const [cpdRows, teacherRows, cohortResult, studentResult] = await Promise.all([
    computeCpdPriorities(user.tenantId, windowDays),
    computeTeacherRiskIndex(user.tenantId, windowDays),
    computeCohortPivot(user.tenantId, windowDays),
    computeStudentRiskIndex(user.tenantId, windowDays, user.id),
  ]);

  return {
    cpdRows,
    teacherRows,
    cohortRows: cohortResult.rows,
    studentRows: studentResult.rows,
    topImproving: getTopImprovingSignals(cpdRows),
  };
}

export async function hydrateHodHomeData({
  user,
  windowDays,
  searchDeptId,
}: {
  user: SessionUser;
  windowDays: number;
  searchDeptId?: string | null;
}) {
  const hodMemberships = await (prisma as any).departmentMembership.findMany({
    where: { userId: user.id, isHeadOfDepartment: true },
    include: { department: true },
  });

  const allDepts: { id: string; name: string }[] = (hodMemberships as any[]).map((m: any) => ({
    id: m.departmentId as string,
    name: m.department.name as string,
  }));

  const activeDeptId: string | null =
    searchDeptId && allDepts.find((d) => d.id === searchDeptId) ? searchDeptId : allDepts[0]?.id ?? null;

  if (!activeDeptId) {
    return {
      allDepts,
      activeDeptId: null,
      deptName: "",
      deptCpdRows: [] as CpdPriorityRow[],
      filteredTeacherRows: [] as TeacherRiskRow[],
      selfProfile: null,
      wholeSchoolTop1: null as CpdPriorityRow | null,
    };
  }

  const deptName = allDepts.find((d) => d.id === activeDeptId)?.name ?? "";

  const [deptCpdRows, deptTeacherRows, selfProfile, wholeSchoolCpd, deptMemberships] = await Promise.all([
    computeCpdPriorities(user.tenantId, windowDays, { departmentId: activeDeptId }),
    computeTeacherRiskIndex(user.tenantId, windowDays),
    computeTeacherSignalProfile(user.tenantId, user.id, windowDays),
    computeCpdPriorities(user.tenantId, windowDays),
    (prisma as any).departmentMembership.findMany({
      where: { tenantId: user.tenantId, departmentId: activeDeptId },
    }),
  ]);

  const deptUserIds = new Set<string>((deptMemberships as any[]).map((m: any) => m.userId as string));
  const filteredTeacherRows = (deptTeacherRows as TeacherRiskRow[]).filter((r) =>
    deptUserIds.has(r.teacherMembershipId)
  );
  const wholeSchoolTop1 = wholeSchoolCpd.find((r) => r.teachersDriftingDown > 0) ?? null;

  return {
    allDepts,
    activeDeptId,
    deptName,
    deptCpdRows,
    filteredTeacherRows,
    selfProfile,
    wholeSchoolTop1,
  };
}

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
