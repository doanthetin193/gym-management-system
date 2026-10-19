import type { PtSchedule } from '../../pt-schedule/types/pt'
import type { PtSessionPackage } from '../../members/types/member'

export function vietnamDate(now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

export function currentPtPackage(packages: PtSessionPackage[], activeMembershipIds: Set<number>, today: string) {
  return packages.find((item) => item.status === 'ACTIVE'
    && item.startDate <= today && item.endDate >= today && activeMembershipIds.has(item.membershipId)) ?? null
}

export function upcomingPtSchedules(schedules: PtSchedule[], now: Date) {
  return schedules
    .filter((schedule) => schedule.status === 'SCHEDULED'
      && new Date(`${schedule.scheduleDate}T${schedule.startTime.slice(0, 5)}:00+07:00`).getTime() > now.getTime())
    .sort((left, right) => `${left.scheduleDate}T${left.startTime}`.localeCompare(`${right.scheduleDate}T${right.startTime}`))
}
