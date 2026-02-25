import { prisma } from '@/lib/prisma'
import { StudentTrendMetrics, StudentDelta, StudentSnapshotRecord } from './types'

export function calculateStudentDeltas(
  current: StudentSnapshotRecord,
  previous: StudentSnapshotRecord | null
): StudentTrendMetrics {
  const makeDelta = (cur: number, prev: number | undefined): StudentDelta | null => {
    if (prev === undefined || prev === null) return null
    const delta = cur - prev
    const percentChange = prev !== 0 ? (delta / prev) * 100 : null
    return { current: cur, previous: prev, delta, percentChange }
  }

  const attendanceDelta = makeDelta(current.attendancePct, previous?.attendancePct)
  const detentionsDelta = makeDelta(current.detentionsCount, previous?.detentionsCount)
  const onCallsDelta = makeDelta(current.onCallsCount, previous?.onCallsCount)

  const behaviourSpikeFlag =
    (detentionsDelta !== null && detentionsDelta.delta > 3) ||
    (onCallsDelta !== null && onCallsDelta.delta > 2)

  const attendanceDropFlag =
    attendanceDelta !== null && attendanceDelta.delta < -2

  return {
    attendanceDelta,
    detentionsDelta,
    onCallsDelta: makeDelta(current.onCallsCount, previous?.onCallsCount),
    latenessDelta: makeDelta(current.latenessCount, previous?.latenessCount),
    suspensionsDelta: makeDelta(current.suspensionsCount, previous?.suspensionsCount),
    internalExclusionsDelta: makeDelta(current.internalExclusionsCount, previous?.internalExclusionsCount),
    behaviourSpikeFlag,
    attendanceDropFlag,
  }
}

export async function getLatestSnapshot(tenantId: string, studentId: string): Promise<StudentSnapshotRecord | null> {
  const snap = await (prisma as any).studentSnapshot.findFirst({
    where: { tenantId, studentId },
    orderBy: { snapshotDate: 'desc' },
  })
  if (!snap) return null
  return {
    ...snap,
    attendancePct: Number(snap.attendancePct),
  }
}

export async function getSnapshotsForWindow(
  tenantId: string,
  studentId: string,
  windowDays: number
): Promise<StudentSnapshotRecord[]> {
  const since = new Date(Date.now() - windowDays * 24 * 3600 * 1000)
  const snaps = await (prisma as any).studentSnapshot.findMany({
    where: { tenantId, studentId, snapshotDate: { gte: since } },
    orderBy: { snapshotDate: 'asc' },
  })
  return snaps.map((s: any) => ({ ...s, attendancePct: Number(s.attendancePct) }))
}

export async function getStudentTrends(
  tenantId: string,
  studentId: string,
  windowDays = 30
): Promise<StudentTrendMetrics | null> {
  const snaps = await getSnapshotsForWindow(tenantId, studentId, windowDays)
  if (snaps.length === 0) return null
  const current = snaps[snaps.length - 1]
  const previous = snaps.length > 1 ? snaps[snaps.length - 2] : null
  return calculateStudentDeltas(current, previous)
}
