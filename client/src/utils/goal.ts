import type { CountdownInfo } from '@/types/goal'

/** 将日期归零到当天 00:00:00，计算与今天的天数差（正=未来，负=过去） */
export function getDayDiff(targetDate: string | Date): number {
  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function getCountdownInfo(targetDate: string | Date): CountdownInfo {
  const diff = getDayDiff(targetDate)

  if (diff === 0) {
    return { days: 0, label: '就是今天', type: 'today' }
  }
  if (diff > 0) {
    return { days: diff, label: `剩余${diff}天`, type: 'future' }
  }
  const abs = Math.abs(diff)
  return { days: abs, label: `已过去${abs}天`, type: 'past' }
}

export function formatTargetDate(targetDate: string | Date): string {
  const d = new Date(targetDate)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
