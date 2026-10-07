export type PtLevel = 'MAIN' | 'NEW'
export type PtAssignmentStatus = 'ACTIVE' | 'ENDED' | 'PAUSED'
export type ScheduleStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'MISSED' | 'RESCHEDULED'
export type SessionPackageStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'
export type PtSessionStatus = 'COMPLETED' | 'CANCELLED' | 'MISSED' | 'RESCHEDULED'
export type ActivityType = 'PRACTICE' | 'GUIDANCE_CHECKIN'
export type GoalType = 'FAT_LOSS' | 'MUSCLE_GAIN' | 'STRENGTH' | 'FITNESS' | 'HEALTH' | 'OTHER'
export type ProgramStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED'

export type PtProfile = {
  id: number
  userId: number
  fullName: string
  ptLevel: PtLevel
  specialty: string | null
  bio: string | null
  baseSalary: number
  teachingRate: number
  salesCommissionRate: number
  active: boolean
}

export type PtProfilePayload = {
  userId: number
  ptLevel: PtLevel
  specialty?: string | null
  bio?: string | null
  active?: boolean
}

export type PtAssignment = {
  id: number
  ptUserId: number
  ptFullName: string
  memberId: number
  memberName: string
  memberPhone: string
  startDate: string
  endDate: string | null
  status: PtAssignmentStatus
  note: string | null
}

export type PtAssignmentPayload = {
  ptUserId: number
  memberId: number
  startDate: string
  endDate?: string | null
  note?: string | null
}

export type PtSchedule = {
  id: number
  ptUserId: number
  ptFullName: string
  memberId: number | null
  memberName: string | null
  scheduleDate: string
  startTime: string
  endTime: string | null
  status: ScheduleStatus
  note: string | null
}

export type PtSchedulePayload = {
  ptUserId: number
  memberId?: number | null
  scheduleDate: string
  startTime: string
  endTime?: string | null
  status?: ScheduleStatus | null
  note?: string | null
}

export type PtSessionPackage = {
  id: number
  memberId: number
  memberName: string
  ptUserId: number | null
  ptFullName: string | null
  membershipId: number
  planName: string
  totalPtSessions: number
  usedPtSessions: number
  remainingPtSessions: number
  totalPracticeSessions: number
  usedPracticeSessions: number
  remainingPracticeSessions: number
  startDate: string
  endDate: string
  status: SessionPackageStatus
}

export type PtSessionLog = {
  id: number
  sessionPackageId: number
  memberId: number
  memberName: string
  ptUserId: number | null
  ptFullName: string | null
  scheduleId: number | null
  sessionDate: string
  sessionNumber: number | null
  weight: number | null
  status: PtSessionStatus
  content: string | null
  note: string | null
}

export type PtSessionLogPayload = {
  sessionPackageId: number
  scheduleId?: number | null
  sessionDate: string
  sessionNumber?: number | null
  weight?: number | null
  status?: PtSessionStatus | null
  content?: string | null
  note?: string | null
}

export type MemberActivityLog = {
  id: number
  memberId: number
  memberName: string
  membershipId: number | null
  sessionPackageId: number | null
  activityType: ActivityType
  activityDate: string
  sessionNumber: number | null
  weight: number | null
  note: string | null
}

export type MemberActivityLogPayload = {
  membershipId?: number | null
  sessionPackageId?: number | null
  activityType: ActivityType
  activityDate: string
  sessionNumber?: number | null
  weight?: number | null
  note?: string | null
}

export type BodyMeasurement = {
  id: number
  memberId: number
  memberName: string
  recordedById: number | null
  recordedByName: string | null
  recordedAt: string
  height: number | null
  weight: number | null
  chest: number | null
  waist: number | null
  abdomen: number | null
  hip: number | null
  thigh: number | null
  arm: number | null
  note: string | null
}

export type BodyMeasurementPayload = {
  recordedAt: string
  height?: number | null
  weight?: number | null
  chest?: number | null
  waist?: number | null
  abdomen?: number | null
  hip?: number | null
  thigh?: number | null
  arm?: number | null
  note?: string | null
}

export type PtGoal = {
  id: number
  memberId: number
  memberName: string
  ptUserId: number | null
  ptFullName: string | null
  goalType: GoalType
  goalDescription: string | null
  startDate: string | null
  targetDate: string | null
  targetWeight: number | null
  targetBodyFat: number | null
  targetWaist: number | null
  status: ProgramStatus
  note: string | null
}

export type PtGoalPayload = {
  ptUserId?: number | null
  goalType: GoalType
  goalDescription?: string | null
  startDate?: string | null
  targetDate?: string | null
  targetWeight?: number | null
  targetBodyFat?: number | null
  targetWaist?: number | null
  note?: string | null
}

export type PtMemberDetail = {
  profile: {
    id: number
    fullName: string
    phone: string
    dateOfBirth: string | null
    gender: string | null
    address: string | null
    zaloPhone: string | null
    source: string | null
    status: string
    note: string | null
  }
  assignments: PtAssignment[]
  sessionPackages: PtSessionPackage[]
  schedules: PtSchedule[]
  sessionLogs: PtSessionLog[]
  activityLogs: MemberActivityLog[]
  bodyMeasurements: BodyMeasurement[]
  goals: PtGoal[]
}
