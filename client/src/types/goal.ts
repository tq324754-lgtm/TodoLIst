export interface Goal {
  _id: string
  userId?: string
  name: string
  description: string
  targetDate: string
  createdAt?: string
}

export interface GoalForm {
  name: string
  description: string
  targetDate: string
}

export type CountdownType = 'past' | 'future' | 'today'

export interface CountdownInfo {
  days: number
  label: string
  type: CountdownType
}
