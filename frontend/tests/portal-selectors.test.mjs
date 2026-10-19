import assert from 'node:assert/strict'
import test from 'node:test'
import {
  currentPtPackage,
  upcomingPtSchedules,
  vietnamDate,
} from '../src/features/member-portal/lib/portalSelectors.ts'

test('vietnamDate uses the calendar date in Asia/Ho_Chi_Minh', () => {
  assert.equal(vietnamDate(new Date('2026-10-18T17:30:00Z')), '2026-10-19')
})

test('currentPtPackage never selects a future or inactive PT package', () => {
  const packages = [
    { id: 3, membershipId: 30, startDate: '2026-11-01', endDate: '2027-02-28', status: 'ACTIVE' },
    { id: 2, membershipId: 20, startDate: '2026-10-01', endDate: '2026-10-31', status: 'ACTIVE' },
    { id: 1, membershipId: 10, startDate: '2026-09-01', endDate: '2026-09-30', status: 'EXPIRED' },
  ]

  assert.equal(currentPtPackage(packages, new Set([20, 30]), '2026-10-18')?.id, 2)
  assert.equal(currentPtPackage(packages, new Set([30]), '2026-10-18'), null)
})

test('upcomingPtSchedules excludes appointments whose start time has passed and sorts the rest', () => {
  const now = new Date('2026-10-18T12:00:00Z') // 19:00 at the gym.
  const schedules = [
    { id: 1, status: 'SCHEDULED', scheduleDate: '2026-10-18', startTime: '18:00:00' },
    { id: 2, status: 'SCHEDULED', scheduleDate: '2026-10-19', startTime: '06:00:00' },
    { id: 3, status: 'SCHEDULED', scheduleDate: '2026-10-18', startTime: '19:30:00' },
    { id: 4, status: 'CANCELLED', scheduleDate: '2026-10-20', startTime: '08:00:00' },
  ]

  assert.deepEqual(upcomingPtSchedules(schedules, now).map((item) => item.id), [3, 2])
})
