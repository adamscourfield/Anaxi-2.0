import { StudentTrendMetrics } from '@/modules/students/types'

export function calculateDelta(
  current: number,
  previous: number
): { delta: number; percentChange: number | null } {
  const delta = current - previous
  const percentChange = previous !== 0 ? (delta / previous) * 100 : null
  return { delta, percentChange }
}

export function getTrendIcon(delta: number): 'up' | 'down' | 'stable' {
  if (delta > 0) return 'up'
  if (delta < 0) return 'down'
  return 'stable'
}

export function shouldFlagBehaviour(
  detentionsDelta: number,
  onCallsDelta: number,
  thresholds = { detentionsThreshold: 3, onCallsThreshold: 2 }
): boolean {
  return detentionsDelta > thresholds.detentionsThreshold || onCallsDelta > thresholds.onCallsThreshold
}

export function shouldFlagAttendance(
  attendanceDelta: number,
  thresholds = { dropThreshold: -2 }
): boolean {
  return attendanceDelta < thresholds.dropThreshold
}

export function getDeltaSummary(trends: StudentTrendMetrics): string {
  const parts: string[] = []

  if (trends.attendanceDropFlag) {
    parts.push(`Attendance drop of ${Math.abs(trends.attendanceDelta?.delta ?? 0).toFixed(1)}%`)
  }
  if (trends.behaviourSpikeFlag) {
    parts.push('Behaviour spike detected')
  }
  if (trends.detentionsDelta && trends.detentionsDelta.delta > 0) {
    parts.push(`+${trends.detentionsDelta.delta} detentions`)
  }
  if (trends.suspensionsDelta && trends.suspensionsDelta.current > 0) {
    parts.push(`${trends.suspensionsDelta.current} suspension(s)`)
  }

  return parts.length > 0 ? parts.join(', ') : 'No significant changes'
}
