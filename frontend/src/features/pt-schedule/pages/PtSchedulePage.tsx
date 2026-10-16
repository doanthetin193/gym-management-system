import {
  Activity,
  AlertCircle,
  Award,
  CalendarClock,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  HeartPulse,
  Phone,
  Plus,
  RefreshCcw,
  Ruler,
  Search,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  X,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, FormEvent, SetStateAction } from 'react'
import { ApiClientError } from '../../../shared/api/apiClient'
import { DatePartsSelect } from '../../../shared/components/DatePartsSelect'
import { addDaysIso, localIsoDate } from '../../../shared/lib/date'
import { useAuth } from '../../auth/context/authContext'
import { listMembers } from '../../members/api/memberApi'
import type { MemberSummary } from '../../members/types/member'
import {
  assignPtMember,
  createActivityLog,
  createBodyMeasurement,
  createPtGoal,
  createPtSchedule,
  createPtSessionLog,
  deletePtSchedule,
  getPtMemberDetail,
  listMyPtMembers,
  listPtProfiles,
  listPtSchedules,
  reassignPtMember,
  savePtProfile,
} from '../api/ptApi'
import type { ActivityType, GoalType, PtAssignment, PtMemberDetail, PtProfile, PtSchedule } from '../types/pt'

type ActivePanel = 'members' | 'schedule' | 'checkin' | 'measurement' | 'goal'

const scheduleStatusLabels: Record<string, string> = {
  SCHEDULED: 'Đã lên lịch',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
  MISSED: 'Vắng mặt',
  RESCHEDULED: 'Đã đổi lịch',
}

const sessionStatusLabels: Record<string, string> = {
  COMPLETED: 'Đã tập',
  CANCELLED: 'Đã hủy',
  MISSED: 'Vắng mặt',
  RESCHEDULED: 'Đã đổi lịch',
}

const goalTypeLabels: Record<GoalType, { label: string; icon: LucideIcon; color: string }> = {
  FAT_LOSS: { label: 'Giảm mỡ & Săn chắc', icon: Flame, color: 'text-amber-500' },
  MUSCLE_GAIN: { label: 'Tăng cơ chuyên sâu', icon: Dumbbell, color: 'text-emerald-500' },
  STRENGTH: { label: 'Tăng sức mạnh', icon: Zap, color: 'text-purple-500' },
  FITNESS: { label: 'Thể lực & Dẻo dai', icon: Activity, color: 'text-cyan-500' },
  HEALTH: { label: 'Sức khỏe tổng thể', icon: HeartPulse, color: 'text-rose-500' },
  OTHER: { label: 'Mục tiêu cá nhân khác', icon: Target, color: 'text-blue-500' },
}

function statusLabel(value: string | null | undefined, labels: Record<string, string>) {
  if (!value) return '-'
  return labels[value] ?? value
}

function todayIso() {
  return localIsoDate()
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`))
}

function formatTimeShort(value: string | null | undefined) {
  if (!value) return ''
  return value.length >= 5 ? value.slice(0, 5) : value
}

function errorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message
  }
  return 'Không thể xử lý yêu cầu. Vui lòng thử lại.'
}

function toNumberOrNull(value: string) {
  return value.trim() ? Number(value) : null
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function getDefaultScheduleSlot() {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const slots = [
    { start: '05:00', end: '06:00', min: 5 * 60 },
    { start: '06:00', end: '07:00', min: 6 * 60 },
    { start: '07:00', end: '08:00', min: 7 * 60 },
    { start: '11:30', end: '12:30', min: 11 * 60 + 30 },
    { start: '17:00', end: '18:00', min: 17 * 60 },
    { start: '18:00', end: '19:00', min: 18 * 60 },
    { start: '19:00', end: '20:00', min: 19 * 60 },
  ]

  // Find next upcoming preset today (starting at least 5 minutes in future)
  const nextSlot = slots.find((s) => s.min >= currentMinutes + 5)
  if (nextSlot) {
    return { startTime: nextSlot.start, endTime: nextSlot.end }
  }

  return { startTime: '17:00', endTime: '18:00' }
}

export function PtSchedulePage() {
  const { user } = useAuth()
  const [activePanel, setActivePanel] = useState<ActivePanel>('members')
  const [profiles, setProfiles] = useState<PtProfile[]>([])
  const [assignments, setAssignments] = useState<PtAssignment[]>([])
  const [memberCandidates, setMemberCandidates] = useState<MemberSummary[]>([])
  const [selectedAssignMember, setSelectedAssignMember] = useState<MemberSummary | null>(null)
  const [memberKeyword, setMemberKeyword] = useState('')
  const [studentSearchKeyword, setStudentSearchKeyword] = useState('')
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [reassigningAssignment, setReassigningAssignment] = useState<PtAssignment | null>(null)
  const [schedules, setSchedules] = useState<PtSchedule[]>([])
  const [detail, setDetail] = useState<PtMemberDetail | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null)
  const detailRequestId = useRef(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [scheduleToDelete, setScheduleToDelete] = useState<PtSchedule | null>(null)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!successNotice) return
    const timer = setTimeout(() => setSuccessNotice(null), 4000)
    return () => clearTimeout(timer)
  }, [successNotice])

  const [assignForm, setAssignForm] = useState({ memberId: '', ptUserId: '', note: '' })
  const [scheduleForm, setScheduleForm] = useState(() => {
    const slot = getDefaultScheduleSlot()
    return {
      memberId: '',
      scheduleDate: todayIso(),
      startTime: slot.startTime,
      endTime: slot.endTime,
      note: '',
    }
  })
  const [sessionForm, setSessionForm] = useState({ sessionPackageId: '', sessionDate: todayIso(), weight: '', content: '', note: '' })
  const [activityForm, setActivityForm] = useState<{ sessionPackageId: string; activityType: ActivityType; activityDate: string; weight: string; note: string }>({
    sessionPackageId: '',
    activityType: 'PRACTICE',
    activityDate: todayIso(),
    weight: '',
    note: '',
  })
  const [measurementForm, setMeasurementForm] = useState({ recordedAt: todayIso(), weight: '', chest: '', waist: '', abdomen: '', hip: '', thigh: '', arm: '', note: '' })
  const [goalForm, setGoalForm] = useState<{ goalType: GoalType; goalDescription: string; targetDate: string; targetWeight: string; targetWaist: string; note: string }>({
    goalType: 'FITNESS',
    goalDescription: '',
    targetDate: '',
    targetWeight: '',
    targetWaist: '',
    note: '',
  })

  const currentProfile = useMemo(() => profiles.find((profile) => profile.userId === user?.id) ?? null, [profiles, user?.id])
  const isOwner = user?.roles.includes('OWNER') ?? false
  const activeProfiles = useMemo(() => profiles.filter((profile) => profile.active), [profiles])
  const selectedPtUserId = isOwner ? Number(assignForm.ptUserId || activeProfiles[0]?.userId || user?.id) : user?.id
  const canManagePtWork = isOwner || Boolean(currentProfile)
  const assignedMemberIds = useMemo(() => new Set(assignments.map((assignment) => assignment.memberId)), [assignments])

  const selectedMemberCandidate = useMemo(
    () => selectedAssignMember ?? memberCandidates.find((member) => member.id === Number(assignForm.memberId)) ?? null,
    [assignForm.memberId, memberCandidates, selectedAssignMember],
  )
  const selectedMemberAssigned = assignForm.memberId ? assignedMemberIds.has(Number(assignForm.memberId)) : false
  const visibleMemberCandidates = selectedMemberCandidate ? [selectedMemberCandidate] : memberCandidates

  const filteredAssignments = useMemo(() => {
    if (!studentSearchKeyword.trim()) return assignments
    const query = studentSearchKeyword.toLowerCase().trim()
    return assignments.filter(
      (a) => a.memberName.toLowerCase().includes(query) || a.memberPhone.includes(query) || a.ptFullName.toLowerCase().includes(query),
    )
  }, [assignments, studentSearchKeyword])

  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => assignment.memberId === selectedMemberId) ?? null,
    [assignments, selectedMemberId],
  )
  const activePackage = detail?.sessionPackages.find((item) => item.status === 'ACTIVE') ?? detail?.sessionPackages[0] ?? null

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [profileData, assignmentData, scheduleData] = await Promise.all([
        listPtProfiles(),
        listMyPtMembers(),
        listPtSchedules({ fromDate: todayIso(), toDate: todayIso() }),
      ])
      setProfiles(profileData)
      setAssignments(assignmentData)
      setSchedules(scheduleData)
      if (!selectedMemberId && assignmentData[0]) {
        selectMember(assignmentData[0].memberId)
      }
    } catch (caughtError) {
      setError(errorMessage(caughtError))
    } finally {
      setLoading(false)
    }
  }, [selectedMemberId])

  const loadDetail = useCallback(async (memberId: number | null) => {
    const requestId = ++detailRequestId.current
    if (!memberId) {
      setDetail(null)
      return
    }
    setDetail(null)
    try {
      const nextDetail = await getPtMemberDetail(memberId)
      if (requestId === detailRequestId.current) {
        setDetail(nextDetail)
        const nextActivePackage = nextDetail.sessionPackages.find((item) => item.status === 'ACTIVE')
          ?? nextDetail.sessionPackages[0]
        const packageIds = new Set(nextDetail.sessionPackages.map((item) => item.id.toString()))
        const defaultPackageId = nextActivePackage?.id.toString() ?? ''
        setSessionForm((current) => (
          packageIds.has(current.sessionPackageId)
            ? current
            : { ...current, sessionPackageId: defaultPackageId }
        ))
        setActivityForm((current) => (
          packageIds.has(current.sessionPackageId)
            ? current
            : { ...current, sessionPackageId: defaultPackageId }
        ))
      }
    } catch (caughtError) {
      if (requestId === detailRequestId.current) {
        setError(errorMessage(caughtError))
      }
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadData])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      listMembers({ keyword: memberKeyword.trim(), filter: 'ACTIVE' })
        .then((items) => setMemberCandidates(items.filter((member) => member.currentPlanType === 'PT').slice(0, 12)))
        .catch((caughtError: unknown) => setError(errorMessage(caughtError)))
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [memberKeyword])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDetail(selectedMemberId)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadDetail, selectedMemberId])

  async function handleCreateMyProfile() {
    if (!user) return
    setSubmitting(true)
    setFormError(null)
    try {
      await savePtProfile({ userId: user.id, ptLevel: 'MAIN', specialty: 'PT chính', active: true })
      await loadData()
    } catch (caughtError) {
      setFormError(errorMessage(caughtError))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAssignMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || !selectedPtUserId || Number.isNaN(selectedPtUserId)) {
      setFormError('Vui lòng chọn PT phụ trách.')
      return
    }
    if (!assignForm.memberId && !reassigningAssignment) {
      setFormError('Vui lòng chọn khách cần gán.')
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      const assignment = reassigningAssignment
        ? await reassignPtMember(reassigningAssignment.id, {
            ptUserId: selectedPtUserId,
            note: assignForm.note.trim() || null,
          })
        : await assignPtMember({
            ptUserId: selectedPtUserId,
            memberId: Number(assignForm.memberId),
            startDate: todayIso(),
            note: assignForm.note.trim() || null,
          })
      setAssignForm((current) => ({ memberId: '', ptUserId: current.ptUserId, note: '' }))
      setMemberKeyword('')
      setSelectedAssignMember(null)
      setReassigningAssignment(null)
      selectMember(assignment.memberId)
      setIsAssignModalOpen(false)
      await loadData()
    } catch (caughtError) {
      setFormError(errorMessage(caughtError))
    } finally {
      setSubmitting(false)
    }
  }

  function openReassignModal(assignment: PtAssignment) {
    setReassigningAssignment(assignment)
    setAssignForm({ memberId: String(assignment.memberId), ptUserId: '', note: '' })
    setMemberKeyword('')
    setSelectedAssignMember(null)
    setFormError(null)
    setIsAssignModalOpen(true)
  }

  function closeAssignModal() {
    setIsAssignModalOpen(false)
    setReassigningAssignment(null)
    setFormError(null)
  }

  function selectMember(memberId: number | null) {
    setSelectedMemberId(memberId)
    setScheduleForm((current) => {
      const nextMemberId = memberId?.toString() ?? ''
      return current.memberId === nextMemberId ? current : { ...current, memberId: nextMemberId }
    })
  }

  async function handleCreateSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return

    const today = todayIso()
    if (scheduleForm.scheduleDate < today) {
      setFormError(`Không thể đặt lịch dạy cho ngày trong quá khứ (${formatDate(scheduleForm.scheduleDate)}).`)
      return
    }

    if (scheduleForm.scheduleDate === today) {
      const now = new Date()
      const currentHHmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      if (scheduleForm.startTime < currentHHmm) {
        setFormError(
          `Không thể đặt lịch dạy trong quá khứ (${scheduleForm.startTime}). Hiện tại đã là ${currentHHmm}, vui lòng chọn khung giờ sắp tới hoặc chuyển sang ngày mai.`,
        )
        return
      }
    }

    if (scheduleForm.endTime && scheduleForm.endTime <= scheduleForm.startTime) {
      setFormError('Giờ kết thúc phải sau giờ bắt đầu.')
      return
    }

    const assignedPtUserId = scheduleForm.memberId
      ? assignments.find((assignment) => assignment.memberId === Number(scheduleForm.memberId))?.ptUserId
      : null
    const schedulePtUserId = isOwner ? (assignedPtUserId ?? selectedPtUserId ?? user.id) : user.id
    setSubmitting(true)
    setFormError(null)
    try {
      await createPtSchedule({
        ptUserId: schedulePtUserId,
        memberId: scheduleForm.memberId ? Number(scheduleForm.memberId) : null,
        scheduleDate: scheduleForm.scheduleDate,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime || null,
        note: scheduleForm.note.trim() || null,
      })
      const nextDefault = getDefaultScheduleSlot()
      setScheduleForm((current) => ({
        ...current,
        startTime: nextDefault.startTime,
        endTime: nextDefault.endTime,
        note: '',
      }))
      setSuccessNotice(`Đặt lịch dạy thành công (${scheduleForm.startTime} - ${scheduleForm.endTime || ''})!`)
      await loadData()
      if (scheduleForm.memberId) {
        await loadDetail(Number(scheduleForm.memberId))
      }
    } catch (caughtError) {
      setFormError(errorMessage(caughtError))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteSchedule(schedule: PtSchedule) {
    setSubmitting(true)
    setFormError(null)
    try {
      await deletePtSchedule(schedule.id)
      setScheduleToDelete(null)
      setSuccessNotice(
        `Đã xoá lịch dạy (${formatTimeShort(schedule.startTime)} - ${formatTimeShort(schedule.endTime)}) của ${schedule.memberName ?? 'học viên'} thành công.`,
      )
      await loadData()
      if (selectedMemberId) {
        await loadDetail(selectedMemberId)
      }
    } catch (caughtError) {
      setFormError(errorMessage(caughtError))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReschedule(schedule: PtSchedule) {
    setSubmitting(true)
    setFormError(null)
    try {
      await deletePtSchedule(schedule.id)
      setScheduleToDelete(null)
      if (schedule.memberId) {
        selectMember(schedule.memberId)
      }
      setScheduleForm((c) => ({
        ...c,
        memberId: schedule.memberId ? String(schedule.memberId) : c.memberId,
        scheduleDate: schedule.scheduleDate >= todayIso() ? schedule.scheduleDate : todayIso(),
        note: schedule.note ?? '',
      }))
      setActivePanel('schedule')
      setSuccessNotice(
        `Đã xoá lịch cũ! Hãy chọn khung giờ mới bên dưới cho học viên ${schedule.memberName ?? ''}.`,
      )
      await loadData()
      if (schedule.memberId) {
        await loadDetail(schedule.memberId)
      }
      setTimeout(() => {
        const formEl = document.getElementById('pt-schedule-booking-form')
        if (formEl) {
          formEl.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    } catch (caughtError) {
      setFormError(errorMessage(caughtError))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const selectedPackageId = Number(sessionForm.sessionPackageId)
    if (!selectedMemberId || !detail || detail.profile.id !== selectedMemberId) {
      setFormError('Đang tải đúng hồ sơ học viên. Vui lòng thử lại sau giây lát.')
      return
    }
    if (!detail.sessionPackages.some((item) => item.id === selectedPackageId)) {
      setFormError('Vui lòng chọn gói PT thuộc đúng học viên đang thao tác.')
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      await createPtSessionLog(selectedMemberId, {
        sessionPackageId: selectedPackageId,
        sessionDate: sessionForm.sessionDate,
        weight: toNumberOrNull(sessionForm.weight),
        status: 'COMPLETED',
        content: sessionForm.content.trim() || null,
        note: sessionForm.note.trim() || null,
      })
      setSessionForm((current) => ({ ...current, content: '', note: '' }))
      await loadDetail(selectedMemberId)
    } catch (caughtError) {
      setFormError(errorMessage(caughtError))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const selectedPackageId = Number(activityForm.sessionPackageId)
    if (!selectedMemberId || !detail || detail.profile.id !== selectedMemberId) {
      setFormError('Đang tải đúng hồ sơ học viên. Vui lòng thử lại sau giây lát.')
      return
    }
    if (activityForm.activityType === 'PRACTICE' && !detail.sessionPackages.some((item) => item.id === selectedPackageId)) {
      setFormError('Vui lòng chọn gói PT thuộc đúng học viên đang thao tác.')
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      await createActivityLog(selectedMemberId, {
        sessionPackageId: activityForm.activityType === 'PRACTICE' ? selectedPackageId : null,
        activityType: activityForm.activityType,
        activityDate: activityForm.activityDate,
        weight: toNumberOrNull(activityForm.weight),
        note: activityForm.note.trim() || null,
      })
      setActivityForm((current) => ({ ...current, note: '' }))
      await loadDetail(selectedMemberId)
    } catch (caughtError) {
      setFormError(errorMessage(caughtError))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateMeasurement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedMemberId) return
    setSubmitting(true)
    setFormError(null)
    try {
      await createBodyMeasurement(selectedMemberId, {
        recordedAt: measurementForm.recordedAt,
        weight: toNumberOrNull(measurementForm.weight),
        chest: toNumberOrNull(measurementForm.chest),
        waist: toNumberOrNull(measurementForm.waist),
        abdomen: toNumberOrNull(measurementForm.abdomen),
        hip: toNumberOrNull(measurementForm.hip),
        thigh: toNumberOrNull(measurementForm.thigh),
        arm: toNumberOrNull(measurementForm.arm),
        note: measurementForm.note.trim() || null,
      })
      setMeasurementForm((current) => ({ ...current, note: '' }))
      await loadDetail(selectedMemberId)
    } catch (caughtError) {
      setFormError(errorMessage(caughtError))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedMemberId || !user) return
    setSubmitting(true)
    setFormError(null)
    try {
      await createPtGoal(selectedMemberId, {
        ptUserId: isOwner ? selectedAssignment?.ptUserId ?? null : user.id,
        goalType: goalForm.goalType,
        goalDescription: goalForm.goalDescription.trim() || null,
        startDate: todayIso(),
        targetDate: goalForm.targetDate || null,
        targetWeight: toNumberOrNull(goalForm.targetWeight),
        targetWaist: toNumberOrNull(goalForm.targetWaist),
        note: goalForm.note.trim() || null,
      })
      setGoalForm((current) => ({ ...current, goalDescription: '', note: '' }))
      await loadDetail(selectedMemberId)
    } catch (caughtError) {
      setFormError(errorMessage(caughtError))
    } finally {
      setSubmitting(false)
    }
  }

  const completedSessionsCount = useMemo(
    () => detail?.sessionLogs.filter((s) => s.status === 'COMPLETED').length ?? 0,
    [detail],
  )

  const activePackagesCount = useMemo(
    () => detail?.sessionPackages.filter((p) => p.status === 'ACTIVE').length ?? 0,
    [detail],
  )

  const todaySchedules = useMemo(
    () => schedules.filter((s) => s.scheduleDate === todayIso()),
    [schedules],
  )

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-yellow)]/35 bg-[var(--brand-yellow)]/10 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-[var(--brand-yellow)]">
              <Sparkles size={12} className="text-[var(--brand-yellow)]" />
              HLV Kèm 1-1 • PT Coaching
            </span>
            <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-0.5 text-xs font-bold text-[var(--text-muted)]">
              {assignments.length} học viên đang kèm
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-black text-[var(--text-strong)] sm:text-3xl">
            Lịch PT & Huấn luyện viên
          </h1>
          <p className="mt-0.5 text-xs font-semibold text-[var(--text-muted)]">
            Quản lý học viên 1-1, điều phối lịch hẹn, điểm danh buổi tập, theo dõi chỉ số và lộ trình mục tiêu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 text-xs font-black text-[var(--text-strong)] shadow-sm hover:border-[var(--brand-yellow)]/50 hover:bg-[var(--surface-muted)] transition-all active:scale-[0.98] disabled:opacity-60"
          >
            <RefreshCcw size={15} className={loading ? 'animate-spin text-[var(--brand-yellow)]' : ''} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={() => setIsAssignModalOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--brand-yellow)] via-amber-500 to-amber-600 px-4 text-xs font-black text-black shadow-[0_4px_16px_rgba(255,204,8,0.25)] hover:brightness-105 transition-all active:scale-[0.98]"
          >
            <UserPlus size={15} />
            Gán học viên mới
          </button>
        </div>
      </div>

      {error || formError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-500 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error ?? formError}</span>
          </div>
          <button type="button" onClick={() => { setError(null); setFormError(null) }} className="text-red-400 hover:text-red-300 p-1">
            <X size={14} />
          </button>
        </div>
      ) : null}

      {successNotice ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-400 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span>{successNotice}</span>
          </div>
          <button type="button" onClick={() => setSuccessNotice(null)} className="text-emerald-400/80 hover:text-emerald-300 p-1">
            <X size={14} />
          </button>
        </div>
      ) : null}

      {/* 4 Compact Luxury Telemetry Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CompactTelemetryCard
          icon={Users}
          label="Học viên được gán"
          value={`${assignments.length} học viên`}
          helper={isOwner ? 'Phân công toàn phòng tập' : 'Phụ trách kèm riêng'}
          iconColor="text-sky-400"
          iconBg="bg-sky-500/15 border-sky-500/30"
          glowColor="rgba(56, 189, 248, 0.5)"
        />
        <CompactTelemetryCard
          icon={CalendarClock}
          label="Lịch dạy hôm nay"
          value={`${schedules.length} buổi hẹn`}
          helper={`Ngày ${formatDate(todayIso())}`}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/15 border-amber-500/30"
          glowColor="rgba(251, 191, 36, 0.5)"
        />
        <CompactTelemetryCard
          icon={Dumbbell}
          label="Buổi tập hoàn thành"
          value={`${completedSessionsCount} buổi`}
          helper={selectedAssignment ? `Học viên: ${selectedAssignment.memberName}` : 'Chọn học viên để xem'}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/15 border-emerald-500/30"
          glowColor="rgba(52, 211, 153, 0.5)"
        />
        <CompactTelemetryCard
          icon={Award}
          label="Gói tập hiệu lực"
          value={`${activePackagesCount} gói PT`}
          helper={activePackage ? activePackage.planName : 'Đang kích hoạt'}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/15 border-purple-500/30"
          glowColor="rgba(192, 132, 252, 0.5)"
        />
      </div>

      {!canManagePtWork ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-[var(--text-strong)]">Chưa kích hoạt hồ sơ Huấn luyện viên</h3>
            <p className="mt-0.5 text-xs font-semibold text-[var(--text-muted)]">
              Tạo hồ sơ PT để bắt đầu gán học viên, điều phối lịch hẹn và quản lý buổi tập 1-1.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleCreateMyProfile()}
            disabled={submitting}
            className="shrink-0 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--brand-yellow)] px-3 text-xs font-black text-black shadow-sm hover:brightness-105 transition-all"
          >
            <UserPlus size={15} />
            Tạo hồ sơ PT ngay
          </button>
        </div>
      ) : null}

      {/* Main Split: Student Directory (Left) + Coaching Control Hub (Right) */}
      <div className="grid gap-5 lg:grid-cols-12 items-start">
        {/* Left Column: Student Selector Directory (4 Cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div>
              <h2 className="text-sm font-black text-[var(--text-strong)] flex items-center gap-1.5">
                <UserCheck size={16} className="text-amber-500" />
                Danh sách học viên
              </h2>
              <p className="text-[11px] font-semibold text-[var(--text-muted)]">
                {assignments.length} khách PT được phân công
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex size-7 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--text-strong)] hover:border-[var(--brand-yellow)] hover:text-[var(--brand-yellow)] transition-all"
              title="Gán thêm khách PT"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={studentSearchKeyword}
              onChange={(e) => setStudentSearchKeyword(e.target.value)}
              placeholder="Lọc theo tên, SĐT học viên..."
              className="h-9 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] pl-8 pr-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)] transition-all"
            />
          </div>

          {/* Student Cards List */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {loading ? (
              <p className="rounded-xl bg-[var(--surface-muted)] p-3 text-center text-xs font-semibold text-[var(--text-muted)]">
                Đang tải dữ liệu học viên...
              </p>
            ) : filteredAssignments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--line)] p-6 text-center">
                <p className="text-xs font-bold text-[var(--text-muted)]">Chưa có học viên phù hợp.</p>
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(true)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-[var(--brand-yellow)] hover:underline"
                >
                  <Plus size={13} />
                  Gán học viên mới
                </button>
              </div>
            ) : (
              filteredAssignments.map((assignment) => {
                const isSelected = selectedMemberId === assignment.memberId
                const initials = getInitials(assignment.memberName)

                return (
                  <div
                    key={assignment.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectMember(assignment.memberId)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        selectMember(assignment.memberId)
                      }
                    }}
                    className={[
                      'w-full rounded-xl border p-3 text-left transition-all relative overflow-hidden group flex items-center gap-3',
                      isSelected
                        ? 'border-amber-400/80 bg-amber-400/10 shadow-[0_0_15px_rgba(251,191,36,0.15)] dark:bg-amber-400/15'
                        : 'border-[var(--line)] bg-[var(--surface-muted)]/40 hover:border-[var(--brand-yellow)]/40 hover:bg-[var(--surface-muted)]',
                    ].join(' ')}
                  >
                    {/* Active Accent Bar */}
                    {isSelected ? (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                    ) : null}

                    {/* Initials Avatar */}
                    <div
                      className={[
                        'grid size-10 place-items-center rounded-xl font-black text-xs shrink-0 transition-transform group-hover:scale-105',
                        isSelected
                          ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-[0_0_10px_rgba(251,191,36,0.4)]'
                          : 'bg-[var(--surface)] text-[var(--text-strong)] border border-[var(--line)]',
                      ].join(' ')}
                    >
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-black text-[var(--text-strong)] truncate">{assignment.memberName}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          {isOwner ? (
                            <button
                              type="button"
                              title="Doi PT phu trach"
                              aria-label={`Doi PT phu trach cho ${assignment.memberName}`}
                              onClick={(event) => {
                                event.stopPropagation()
                                openReassignModal(assignment)
                              }}
                              className="grid size-6 place-items-center rounded-md text-amber-500 hover:bg-amber-500/15"
                            >
                              <RefreshCcw size={13} />
                            </button>
                          ) : null}
                          <span className="text-[10px] font-bold text-emerald-500">1-1</span>
                        </div>
                      </div>
                      <p className="text-[11px] font-semibold text-[var(--text-muted)] truncate">{assignment.memberPhone}</p>
                      {isOwner ? (
                        <p className="text-[10px] font-bold text-amber-500 truncate mt-0.5">PT: {assignment.ptFullName}</p>
                      ) : null}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Mini Today's Agenda in Student Sidebar */}
          <div className="pt-3 border-t border-[var(--line)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <CalendarClock size={13} className="text-amber-500" />
                Lịch dạy hôm nay ({todaySchedules.length})
              </span>
              <button
                type="button"
                onClick={() => setActivePanel('schedule')}
                className="text-[10px] font-bold text-amber-500 hover:underline"
              >
                Xem tất cả
              </button>
            </div>
            {todaySchedules.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--line)] p-2.5 text-center">
                <p className="text-[11px] font-semibold text-[var(--text-muted)]">Hôm nay không có lịch dạy.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                {todaySchedules.map((s) => (
                  <div key={s.id} className="group rounded-lg border border-[var(--line)] bg-[var(--surface-muted)]/50 p-2 text-xs flex items-center justify-between gap-1.5 hover:border-amber-500/30 transition-colors">
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--text-strong)] truncate">{s.memberName ?? 'Khách vãng lai'}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{formatTimeShort(s.startTime)} - {formatTimeShort(s.endTime) || 'Xong'}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="rounded bg-amber-500/15 text-amber-500 px-1.5 py-0.5 text-[9px] font-black">
                        {scheduleStatusLabels[s.status] ?? s.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => setScheduleToDelete(s)}
                        title="Xoá / Huỷ lịch này"
                        className="rounded p-1 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Coaching Control Hub & Tabs (8 Cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm space-y-5">
          {/* Top 5 Luxury Tabs */}
          <div className="border-b border-[var(--line)] pb-3">
            <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
              <PanelTab active={activePanel === 'members'} icon={UserCheck} label="Khách PT" onClick={() => setActivePanel('members')} />
              <PanelTab active={activePanel === 'schedule'} icon={CalendarClock} label="Lịch dạy" onClick={() => setActivePanel('schedule')} />
              <PanelTab active={activePanel === 'checkin'} icon={Dumbbell} label="Ghi buổi tập" onClick={() => setActivePanel('checkin')} />
              <PanelTab active={activePanel === 'measurement'} icon={Ruler} label="Chỉ số" onClick={() => setActivePanel('measurement')} />
              <PanelTab active={activePanel === 'goal'} icon={Target} label="Mục tiêu" onClick={() => setActivePanel('goal')} />
            </div>
          </div>

          {/* Active Tab Views */}
          <div>
            {activePanel === 'members' ? (
              <MemberOverview
                detail={detail}
                onNavigateTab={setActivePanel}
                onRequestDeleteSchedule={(sch) => setScheduleToDelete(sch)}
                onReschedule={handleReschedule}
              />
            ) : null}
            {activePanel === 'schedule' ? (
              <SchedulePanel
                assignments={assignments}
                schedules={schedules}
                form={scheduleForm}
                setForm={setScheduleForm}
                submitting={submitting}
                onSubmit={handleCreateSchedule}
                selectedMemberId={selectedMemberId}
                onSelectMember={selectMember}
                onRequestDelete={(sch) => setScheduleToDelete(sch)}
                onRequestReschedule={handleReschedule}
              />
            ) : null}
            {activePanel === 'checkin' ? (
              <CheckinPanel
                detail={detail}
                sessionForm={sessionForm}
                setSessionForm={setSessionForm}
                activityForm={activityForm}
                setActivityForm={setActivityForm}
                submitting={submitting}
                onSessionSubmit={handleCreateSession}
                onActivitySubmit={handleCreateActivity}
              />
            ) : null}
            {activePanel === 'measurement' ? (
              <MeasurementPanel
                detail={detail}
                form={measurementForm}
                setForm={setMeasurementForm}
                submitting={submitting}
                onSubmit={handleCreateMeasurement}
              />
            ) : null}
            {activePanel === 'goal' ? (
              <GoalPanel
                detail={detail}
                form={goalForm}
                setForm={setGoalForm}
                submitting={submitting}
                onSubmit={handleCreateGoal}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* Delete / Reschedule Confirmation Modal */}
      {scheduleToDelete ? (
        <DeleteScheduleModal
          schedule={scheduleToDelete}
          submitting={submitting}
          onClose={() => setScheduleToDelete(null)}
          onConfirmDelete={handleDeleteSchedule}
          onConfirmReschedule={handleReschedule}
        />
      ) : null}

      {/* Assignment Modal (Replaces permanent bulky form) */}
      {isAssignModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-500">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[var(--text-strong)]">Phân công / Gán khách PT</h3>
                  <p className="text-xs font-semibold text-[var(--text-muted)]">Chỉ định HLV kèm 1-1 cho hội viên</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeAssignModal}
                className="grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-strong)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(e) => void handleAssignMember(e)} className="space-y-3.5">
              {isOwner ? (
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                    Huấn luyện viên phụ trách
                  </label>
                  <select
                    value={assignForm.ptUserId || activeProfiles[0]?.userId || ''}
                    onChange={(e) => setAssignForm((current) => ({ ...current, ptUserId: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none focus:border-[var(--brand-yellow)]"
                    required
                  >
                    {activeProfiles.length === 0 ? <option value="">Chưa có hồ sơ PT</option> : null}
                    {activeProfiles.map((p) => (
                      <option key={p.id} value={p.userId}>{p.fullName} ({p.specialty ?? 'PT'})</option>
                    ))}
                  </select>
                </div>
              ) : null}

              {!reassigningAssignment ? (
                <>
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Tìm hội viên cần gán (tên hoặc SĐT)
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    value={memberKeyword}
                    onChange={(e) => {
                      setMemberKeyword(e.target.value)
                      setSelectedAssignMember(null)
                      setAssignForm((c) => ({ ...c, memberId: '' }))
                    }}
                    placeholder="Gõ tên, số điện thoại hoặc Zalo..."
                    className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] pl-8 pr-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
                  />
                </div>
              </div>

              {/* Candidate Selection List */}
              <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/50 p-2">
                {visibleMemberCandidates.length === 0 ? (
                  <p className="p-3 text-center text-xs font-semibold text-[var(--text-muted)]">
                    Không tìm thấy hội viên phù hợp hoặc chưa có gói PT.
                  </p>
                ) : (
                  visibleMemberCandidates.map((member) => {
                    const isSelected = assignForm.memberId === String(member.id)
                    const isAssigned = assignedMemberIds.has(member.id)
                    return (
                      <button
                        key={member.id}
                        type="button"
                        disabled={isAssigned}
                        onClick={() => {
                          setSelectedAssignMember(member)
                          setMemberKeyword('')
                          setMemberCandidates([member])
                          setAssignForm((c) => ({ ...c, memberId: String(member.id) }))
                        }}
                        className={[
                          'w-full rounded-lg border p-2.5 text-left transition-all flex items-center justify-between gap-2',
                          isAssigned
                            ? 'cursor-not-allowed opacity-50 border-transparent bg-transparent'
                            : isSelected
                              ? 'border-amber-400 bg-amber-400/15 shadow-sm'
                              : 'border-transparent bg-[var(--surface)] hover:border-[var(--line)]',
                        ].join(' ')}
                      >
                        <div>
                          <p className="text-xs font-black text-[var(--text-strong)]">{member.fullName}</p>
                          <p className="text-[11px] font-semibold text-[var(--text-muted)]">
                            {member.phone} • {member.currentPlanName ?? 'Chưa đăng ký'}
                          </p>
                        </div>
                        <span className={`text-[10px] font-black rounded px-1.5 py-0.5 ${isAssigned ? 'bg-zinc-500/15 text-zinc-400' : 'bg-emerald-500/15 text-emerald-500'}`}>
                          {isAssigned ? 'Đã có PT' : 'Có thể gán'}
                        </span>
                      </button>
                    )
                  })
                )}
              </div>

              {selectedMemberCandidate ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs font-bold text-emerald-500 flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  <span>Đã chọn: <strong>{selectedMemberCandidate.fullName}</strong> ({selectedMemberCandidate.phone})</span>
                </div>
              ) : null}
                </>
              ) : (
                <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-xs font-bold text-sky-500">
                  Đang đổi PT phụ trách cho: <strong>{reassigningAssignment.memberName}</strong> ({reassigningAssignment.memberPhone})
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Ghi chú phân công
                </label>
                <input
                  value={assignForm.note}
                  onChange={(e) => setAssignForm((c) => ({ ...c, note: e.target.value }))}
                  placeholder="Ví dụ: Khách cần siết cân, tập 3 buổi/tuần..."
                  className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={closeAssignModal}
                  className="h-10 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 text-xs font-black text-[var(--text)] hover:bg-[var(--surface-muted)]"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submitting || (!reassigningAssignment && (!assignForm.memberId || selectedMemberAssigned))}
                  className="h-10 rounded-xl bg-gradient-to-r from-[var(--brand-yellow)] to-amber-500 px-5 text-xs font-black text-black shadow-sm hover:brightness-105 disabled:opacity-50"
                >
                  {submitting ? 'Đang xử lý...' : reassigningAssignment ? 'Xác nhận đổi PT' : 'Xác nhận gán'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function CompactTelemetryCard({
  icon: Icon,
  label,
  value,
  helper,
  iconColor,
  iconBg,
  glowColor,
}: {
  icon: LucideIcon
  label: string
  value: string
  helper: string
  iconColor: string
  iconBg: string
  glowColor: string
}) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5 shadow-sm hover:border-[var(--brand-yellow)]/40 transition-all flex items-center gap-3.5 group">
      <div
        className="absolute -right-6 -top-6 size-20 rounded-full opacity-20 blur-xl pointer-events-none group-hover:opacity-40 transition-opacity"
        style={{ backgroundColor: glowColor }}
      />
      <div className={`grid size-11 place-items-center rounded-xl border ${iconBg} ${iconColor} shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] truncate">{label}</p>
        <p className="text-xl font-black text-[var(--text-strong)] tracking-tight truncate">{value}</p>
        <p className="text-[10px] font-semibold text-[var(--text-muted)] truncate">{helper}</p>
      </div>
    </article>
  )
}

function PanelTab({ active, icon: Icon, label, onClick }: { active: boolean; icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3.5 text-xs font-black transition-all shrink-0',
        active
          ? 'bg-[var(--brand-yellow)] text-black shadow-[0_0_12px_rgba(255,204,8,0.35)]'
          : 'border border-[var(--line)] bg-[var(--surface-muted)]/50 text-[var(--text-muted)] hover:border-amber-400/40 hover:text-[var(--text-strong)]',
      ].join(' ')}
    >
      <Icon size={14} className={active ? 'text-black' : ''} />
      {label}
    </button>
  )
}

function MemberOverview({
  detail,
  onNavigateTab,
  onRequestDeleteSchedule,
  onReschedule,
}: {
  detail: PtMemberDetail | null
  onNavigateTab: (tab: ActivePanel) => void
  onRequestDeleteSchedule?: (schedule: PtSchedule) => void
  onReschedule?: (schedule: PtSchedule) => Promise<void>
}) {
  const sortedMeasurements = useMemo(() => {
    if (!detail) {
      return []
    }
    return [...detail.bodyMeasurements].sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
    )
  }, [detail])

  const todayStr = todayIso()
  const upcomingSchedules = useMemo(() => {
    if (!detail) {
      return []
    }
    return detail.schedules
      .filter((s) => s.status === 'SCHEDULED' && s.scheduleDate >= todayStr)
      .sort((a, b) => `${a.scheduleDate}T${a.startTime}`.localeCompare(`${b.scheduleDate}T${b.startTime}`))
  }, [detail, todayStr])

  if (!detail) {
    return <EmptySelect message="Vui lòng chọn học viên từ danh sách bên trái để xem hồ sơ huấn luyện." />
  }

  const initials = getInitials(detail.profile.fullName)

  // Primary active package
  const activePackage = detail.sessionPackages.find((p) => p.status === 'ACTIVE') ?? detail.sessionPackages[0] ?? null
  const activeAssignment = detail.assignments.find(
    (assignment) => assignment.status === 'ACTIVE' && assignment.ptUserId === activePackage?.ptUserId,
  ) ?? detail.assignments.find((assignment) => assignment.status === 'ACTIVE') ?? null
  const totalPtSessions = activePackage?.totalPtSessions ?? 0
  const usedPtSessions = activePackage?.usedPtSessions ?? 0
  const remainingPtSessions = activePackage?.remainingPtSessions ?? 0
  const ptPercent = totalPtSessions > 0 ? Math.round((usedPtSessions / totalPtSessions) * 100) : 0

  const totalPracticeSessions = activePackage?.totalPracticeSessions ?? 0
  const usedPracticeSessions = activePackage?.usedPracticeSessions ?? 0
  const practicePercent = totalPracticeSessions > 0 ? Math.round((usedPracticeSessions / totalPracticeSessions) * 100) : 0

  const latestMeasurement = sortedMeasurements[0] ?? null
  const previousMeasurement = sortedMeasurements[1] ?? null
  const initialMeasurement = sortedMeasurements[sortedMeasurements.length - 1] ?? null

  const weightDelta =
    latestMeasurement?.weight && previousMeasurement?.weight
      ? Number((latestMeasurement.weight - previousMeasurement.weight).toFixed(1))
      : null

  const totalWeightDelta =
    latestMeasurement?.weight && initialMeasurement?.weight && sortedMeasurements.length > 1
      ? Number((latestMeasurement.weight - initialMeasurement.weight).toFixed(1))
      : null

  // Active goal
  const activeGoal = detail.goals.find((g) => g.status === 'ACTIVE') ?? detail.goals[0] ?? null
  const goalConfig = activeGoal ? goalTypeLabels[activeGoal.goalType] : null

  const nextSchedule = upcomingSchedules[0] ?? null

  return (
    <div className="space-y-4">
      {/* 1. Student Hero Profile Card */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)]/40 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-black text-lg font-black shrink-0 shadow-[0_0_16px_rgba(251,191,36,0.35)]">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black text-[var(--text-strong)] truncate">{detail.profile.fullName}</h3>
              <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black shrink-0">
                {detail.profile.status === 'ACTIVE' ? 'Đang tập' : 'Đang hoạt động'}
              </span>
              {activeAssignment ? (
                <span className="rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-black shrink-0">
                  HLV: {activeAssignment.ptFullName}
                </span>
              ) : null}
            </div>
            <p className="text-xs font-semibold text-[var(--text-muted)] mt-1 flex flex-wrap items-center gap-2">
              <span>{detail.profile.phone}</span>
              {detail.profile.gender ? <span>• Giới tính: {detail.profile.gender}</span> : null}
              {detail.profile.dateOfBirth ? <span>• NS: {formatDate(detail.profile.dateOfBirth)}</span> : null}
              {detail.profile.address ? <span>• {detail.profile.address}</span> : null}
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {detail.profile.phone ? (
            <a
              href={`https://zalo.me/${detail.profile.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3.5 text-xs font-black text-blue-400 hover:bg-blue-500/20 transition-all shadow-sm"
            >
              <Phone size={13} />
              Nhắn Zalo
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => onNavigateTab('schedule')}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 text-xs font-black text-[var(--text-strong)] hover:border-amber-400/50 hover:bg-[var(--surface-muted)] transition-all shadow-sm"
          >
            <CalendarClock size={13} className="text-amber-500" />
            Lên lịch
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('checkin')}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--brand-yellow)] via-amber-500 to-amber-600 px-3.5 text-xs font-black text-black shadow-[0_2px_12px_rgba(255,204,8,0.25)] hover:brightness-105 transition-all"
          >
            <Dumbbell size={13} />
            Ghi buổi tập
          </button>
        </div>
      </div>

      {/* 2. Quick Vital Telemetry Strip (4 Metric Tiles) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/30 p-3 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
            <Award size={12} className="text-amber-500" />
            Buổi PT còn lại
          </p>
          <p className="mt-1 text-lg font-black text-amber-500 tracking-tight">
            {remainingPtSessions} <span className="text-xs font-semibold text-[var(--text-muted)]">/ {totalPtSessions} buổi</span>
          </p>
          <p className="text-[10px] font-semibold text-[var(--text-muted)] mt-0.5">
            Đã hoàn thành {usedPtSessions} buổi ({ptPercent}%)
          </p>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/30 p-3 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
            <Activity size={12} className="text-emerald-500" />
            Tự tập & Điểm danh
          </p>
          <p className="mt-1 text-lg font-black text-emerald-400 tracking-tight">
            {detail.activityLogs.length} <span className="text-xs font-semibold text-[var(--text-muted)]">lần tự tập</span>
          </p>
          <p className="text-[10px] font-semibold text-[var(--text-muted)] mt-0.5">
            {usedPracticeSessions}/{totalPracticeSessions} buổi định mức ({practicePercent}%)
          </p>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/30 p-3 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
            <Ruler size={12} className="text-purple-400" />
            Cân nặng hiện tại
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-black text-[var(--text-strong)] tracking-tight">
              {latestMeasurement?.weight ? `${latestMeasurement.weight} kg` : '--'}
            </span>
            {weightDelta !== null ? (
              <span
                className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                  weightDelta < 0
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : weightDelta > 0
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-zinc-500/15 text-zinc-400'
                }`}
              >
                {weightDelta > 0 ? `+${weightDelta}` : weightDelta} kg
              </span>
            ) : null}
          </div>
          <p className="text-[10px] font-semibold text-[var(--text-muted)] mt-0.5">
            {totalWeightDelta !== null ? `Thay đổi tổng: ${totalWeightDelta > 0 ? `+${totalWeightDelta}` : totalWeightDelta} kg` : 'Theo dõi định kỳ'}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/30 p-3 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
            <Target size={12} className="text-cyan-400" />
            Vòng eo gần nhất
          </p>
          <p className="mt-1 text-lg font-black text-cyan-400 tracking-tight">
            {latestMeasurement?.waist ? `${latestMeasurement.waist} cm` : '--'}
          </p>
          <p className="text-[10px] font-semibold text-[var(--text-muted)] mt-0.5">
            {latestMeasurement ? formatDate(latestMeasurement.recordedAt) : 'Chưa có số đo'}
          </p>
        </div>
      </div>

      {/* 3. Balanced Dual Section: Gói tập (Left) + Lịch hẹn kế tiếp (Right) */}
      <div className="grid gap-4 lg:grid-cols-12 items-stretch">
        {/* Left: Active Session Package (7 Cols if 1 package) */}
        <div className={`${detail.sessionPackages.length > 1 ? 'lg:col-span-12' : 'lg:col-span-7'} rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/30 p-4 flex flex-col justify-between space-y-3`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] pb-2.5">
              <div className="flex items-center gap-2">
                <div className="grid size-7 place-items-center rounded-lg bg-amber-500/15 text-amber-500">
                  <Award size={15} />
                </div>
                <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-strong)]">
                  Gói tập & Tiến độ buổi học
                </h4>
              </div>
              <span className="rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-black">
                {activePackage ? `Còn ${activePackage.remainingPtSessions} buổi PT` : 'Chưa kích hoạt'}
              </span>
            </div>

            {activePackage ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="text-sm font-black text-[var(--text-strong)] truncate">{activePackage.planName}</h5>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md shrink-0">
                    {activePackage.status === 'ACTIVE' ? 'Đang hiệu lực' : activePackage.status}
                  </span>
                </div>

                {/* PT Progress */}
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-amber-400" />
                      Buổi kèm 1-1 (Huấn luyện viên)
                    </span>
                    <span className="text-[var(--text-strong)]">
                      {activePackage.usedPtSessions}/{activePackage.totalPtSessions} buổi ({ptPercent}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-200/60 dark:bg-slate-800/80 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-[#ffe066] shadow-[0_0_8px_rgba(251,191,36,0.5)] transition-all duration-500"
                      style={{ width: `${ptPercent}%` }}
                    />
                  </div>
                </div>

                {/* Practice Progress */}
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-400" />
                      Tự ôn tập (Học viên tự luyện)
                    </span>
                    <span className="text-[var(--text-strong)]">
                      {activePackage.usedPracticeSessions}/{activePackage.totalPracticeSessions} buổi ({practicePercent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200/60 dark:bg-slate-800/80 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${practicePercent}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs font-semibold text-[var(--text-muted)] py-4 text-center">
                Chưa có gói tập PT nào được gán cho học viên này.
              </p>
            )}
          </div>

          {activePackage ? (
            <div className="pt-2.5 border-t border-[var(--line)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>Thời hạn gói: <strong>{formatDate(activePackage.startDate)} – {formatDate(activePackage.endDate)}</strong></span>
              <span className="font-semibold text-amber-500">1-1 Coaching</span>
            </div>
          ) : null}
        </div>

        {/* Right: Next Scheduled Session (5 Cols) - Eliminates empty gap! */}
        <div className={`${detail.sessionPackages.length > 1 ? 'lg:col-span-12' : 'lg:col-span-5'} rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/30 p-4 flex flex-col justify-between space-y-3`}>
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] pb-2.5">
              <div className="flex items-center gap-2">
                <div className="grid size-7 place-items-center rounded-lg bg-sky-500/15 text-sky-400">
                  <CalendarClock size={15} />
                </div>
                <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-strong)]">
                  Lịch hẹn tiếp theo
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('schedule')}
                className="text-[10px] font-bold text-amber-500 hover:underline"
              >
                Quản lý lịch
              </button>
            </div>

            {nextSchedule ? (
              <div className="mt-3 rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-sky-400 flex items-center gap-1.5">
                    <Clock size={13} />
                    {formatTimeShort(nextSchedule.startTime)} {nextSchedule.endTime ? `- ${formatTimeShort(nextSchedule.endTime)}` : ''}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 text-[10px] font-black">
                      {scheduleStatusLabels[nextSchedule.status] ?? nextSchedule.status}
                    </span>
                    {onRequestDeleteSchedule ? (
                      <button
                        type="button"
                        onClick={() => onRequestDeleteSchedule(nextSchedule)}
                        title="Xoá lịch hẹn này"
                        className="rounded p-1 text-red-400/80 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    ) : null}
                  </div>
                </div>
                <p className="text-sm font-black text-[var(--text-strong)]">
                  {formatDate(nextSchedule.scheduleDate)}
                </p>
                {nextSchedule.note ? (
                  <p className="text-xs text-[var(--text-muted)] italic">
                    "{nextSchedule.note}"
                  </p>
                ) : (
                  <p className="text-[11px] text-[var(--text-muted)]">
                    HLV: {nextSchedule.ptFullName}
                  </p>
                )}
                <div className="pt-2 flex items-center justify-between border-t border-sky-500/20 text-[11px]">
                  {onReschedule ? (
                    <button
                      type="button"
                      onClick={() => void onReschedule(nextSchedule)}
                      className="inline-flex items-center gap-1 font-bold text-amber-400 hover:underline"
                    >
                      <RefreshCcw size={11} />
                      Đổi giờ mới
                    </button>
                  ) : null}
                  {onRequestDeleteSchedule ? (
                    <button
                      type="button"
                      onClick={() => onRequestDeleteSchedule(nextSchedule)}
                      className="inline-flex items-center gap-1 font-bold text-red-400 hover:underline"
                    >
                      <Trash2 size={11} />
                      Xoá lịch này
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-[var(--line)] p-4 text-center space-y-2">
                <p className="text-xs font-semibold text-[var(--text-muted)]">
                  Chưa có lịch hẹn nào sắp tới cho học viên này.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigateTab('schedule')}
                  className="inline-flex items-center gap-1 text-xs font-black text-[var(--brand-yellow)] hover:underline"
                >
                  <Plus size={13} />
                  Lên lịch buổi tiếp theo ngay
                </button>
              </div>
            )}
          </div>

          {/* Quick Schedule Prompt Footer */}
          <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-muted)]">Tổng lịch đã tạo: <strong>{detail.schedules.length} buổi</strong></span>
            <button
              type="button"
              onClick={() => onNavigateTab('schedule')}
              className="text-[11px] font-bold text-amber-500 hover:text-amber-400"
            >
              + Đặt lịch mới
            </button>
          </div>
        </div>
      </div>

      {/* 4. Active Goal & Coaching Directives (Mục tiêu & Dặn dò sức khỏe) */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Goal Card (7 Cols) */}
        <div className="lg:col-span-7 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/30 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
            <div className="flex items-center gap-2">
              <div className="grid size-7 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400">
                <Target size={15} />
              </div>
              <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-strong)]">
                Mục tiêu huấn luyện học viên
              </h4>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('goal')}
              className="text-[10px] font-bold text-amber-500 hover:underline"
            >
              {activeGoal ? 'Chi tiết / Đổi mục tiêu' : '+ Thiết lập mục tiêu'}
            </button>
          </div>

          {activeGoal ? (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  {goalConfig ? (
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-md bg-[var(--surface)] border border-[var(--line)] px-2 py-0.5 text-xs font-bold ${goalConfig.color}`}>
                      <goalConfig.icon size={12} />
                      {goalConfig.label}
                    </span>
                  ) : null}
                  <span className="min-w-[160px] flex-1 text-xs font-black text-[var(--text-strong)] line-clamp-2">
                    {activeGoal.goalDescription ?? 'Mục tiêu thể hình'}
                  </span>
                </div>
                {activeGoal.targetDate ? (
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                    Hạn chót: {formatDate(activeGoal.targetDate)}
                  </span>
                ) : null}
              </div>

              {/* Target Targets Strip */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-xs">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] block">Cân nặng mục tiêu:</span>
                  <span className="text-sm font-black text-[var(--text-strong)]">
                    {activeGoal.targetWeight ? `${activeGoal.targetWeight} kg` : 'Chưa đặt'}
                  </span>
                </div>
                <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-xs">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] block">Vòng eo mục tiêu:</span>
                  <span className="text-sm font-black text-[var(--text-strong)]">
                    {activeGoal.targetWaist ? `${activeGoal.targetWaist} cm` : 'Chưa đặt'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--line)] p-4 text-center">
              <p className="text-xs font-semibold text-[var(--text-muted)]">
                Chưa thiết lập mục tiêu huấn luyện cụ thể cho học viên này.
              </p>
              <button
                type="button"
                onClick={() => onNavigateTab('goal')}
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-black text-[var(--brand-yellow)] hover:underline"
              >
                <Plus size={13} />
                Thiết lập mục tiêu giảm mỡ / tăng cơ ngay
              </button>
            </div>
          )}
        </div>

        {/* Health Notes & Directives (5 Cols) */}
        <div className="lg:col-span-5 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/30 p-4 space-y-2.5">
          <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2.5">
            <div className="grid size-7 place-items-center rounded-lg bg-rose-500/15 text-rose-400">
              <HeartPulse size={15} />
            </div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-strong)]">
              Ghi chú sức khỏe & Dặn dò HLV
            </h4>
          </div>

          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 text-xs min-h-[82px] flex items-center">
            {detail.profile.note ? (
              <p className="text-xs font-semibold text-[var(--text-strong)] leading-relaxed">
                "{detail.profile.note}"
              </p>
            ) : (
              <p className="text-xs font-medium text-[var(--text-muted)] italic">
                Chưa có ghi chú đặc biệt về tiền sử chấn thương hay chế độ ăn. HLV có thể cập nhật trong hồ sơ hội viên.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 5. Three Columns: Recent PT Logs | Body Measurements | Self-Practice History */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Box 1: Recent PT Logs */}
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/30 p-4 space-y-2.5">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
            <h4 className="text-xs font-black text-[var(--text-strong)] flex items-center gap-1.5">
              <Dumbbell size={14} className="text-amber-500" />
              Nhật ký buổi PT gần nhất
            </h4>
            <button
              type="button"
              onClick={() => onNavigateTab('checkin')}
              className="text-[10px] font-bold text-amber-500 hover:underline"
            >
              + Ghi buổi
            </button>
          </div>
          <div className="space-y-1.5">
            {detail.sessionLogs.length === 0 ? (
              <p className="text-xs font-semibold text-[var(--text-muted)] py-3 text-center">Chưa ghi nhận buổi tập nào.</p>
            ) : (
              detail.sessionLogs.slice(0, 3).map((log) => (
                <div key={log.id} className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2.5 text-xs flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-[var(--text-strong)] truncate">{log.content ?? 'Buổi tập thể hình'}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{formatDate(log.sessionDate)} {log.weight ? `• ${log.weight} kg` : ''}</p>
                  </div>
                  <span className="rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-black shrink-0">
                    {statusLabel(log.status, sessionStatusLabels)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Box 2: Body Measurements */}
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/30 p-4 space-y-2.5">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
            <h4 className="text-xs font-black text-[var(--text-strong)] flex items-center gap-1.5">
              <Ruler size={14} className="text-purple-400" />
              Chỉ số cơ thể gần nhất
            </h4>
            <button
              type="button"
              onClick={() => onNavigateTab('measurement')}
              className="text-[10px] font-bold text-amber-500 hover:underline"
            >
              + Đo chỉ số
            </button>
          </div>
          <div className="space-y-1.5">
            {detail.bodyMeasurements.length === 0 ? (
              <p className="text-xs font-semibold text-[var(--text-muted)] py-3 text-center">Chưa có dữ liệu đo đạc.</p>
            ) : (
              detail.bodyMeasurements.slice(0, 3).map((m) => (
                <div key={m.id} className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2.5 text-xs flex items-center justify-between gap-2">
                  <div>
                    <span className="font-black text-[var(--text-strong)]">{m.weight ? `${m.weight} kg` : '-'}</span>
                    <span className="text-[10px] text-[var(--text-muted)] ml-2">Eo: {m.waist ?? '-'} cm • Ngực: {m.chest ?? '-'} cm</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[var(--text-muted)] shrink-0">
                    {formatDate(m.recordedAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Box 3: Self-Practice / Activity Logs */}
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/30 p-4 space-y-2.5">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
            <h4 className="text-xs font-black text-[var(--text-strong)] flex items-center gap-1.5">
              <Activity size={14} className="text-emerald-400" />
              Nhật ký tự luyện tập ({detail.activityLogs.length})
            </h4>
            <button
              type="button"
              onClick={() => onNavigateTab('checkin')}
              className="text-[10px] font-bold text-amber-500 hover:underline"
            >
              + Điểm danh
            </button>
          </div>
          <div className="space-y-1.5">
            {detail.activityLogs.length === 0 ? (
              <p className="text-xs font-semibold text-[var(--text-muted)] py-3 text-center">Chưa ghi nhận tự tập nào.</p>
            ) : (
              detail.activityLogs.slice(0, 3).map((act) => (
                <div key={act.id} className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2.5 text-xs flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-[var(--text-strong)] truncate">
                      {act.activityType === 'PRACTICE' ? 'Học viên tự ôn tập' : 'Hướng dẫn & Điểm danh'}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">{formatDate(act.activityDate)} {act.weight ? `• ${act.weight} kg` : ''}</p>
                  </div>
                  <span className="rounded bg-teal-500/15 text-teal-400 border border-teal-500/30 px-1.5 py-0.5 text-[9px] font-black shrink-0">
                    Tự tập
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SchedulePanel({
  assignments,
  schedules,
  form,
  setForm,
  submitting,
  onSubmit,
  selectedMemberId,
  onSelectMember,
  onRequestDelete,
  onRequestReschedule,
}: {
  assignments: PtAssignment[]
  schedules: PtSchedule[]
  form: { memberId: string; scheduleDate: string; startTime: string; endTime: string; note: string }
  setForm: Dispatch<SetStateAction<{ memberId: string; scheduleDate: string; startTime: string; endTime: string; note: string }>>
  submitting: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
  selectedMemberId: number | null
  onSelectMember: (memberId: number | null) => void
  onRequestDelete: (schedule: PtSchedule) => void
  onRequestReschedule: (schedule: PtSchedule) => void | Promise<void>
}) {
  function applyTimePreset(start: string, end: string) {
    setForm((c) => ({ ...c, startTime: start, endTime: end }))
  }

  const selectedMember = assignments.find((assignment) => assignment.memberId === selectedMemberId) ?? null
  const selectedSchedules = selectedMemberId === null
    ? []
    : schedules.filter((schedule) => schedule.memberId === selectedMemberId)

  const isToday = form.scheduleDate === todayIso()
  const isPastDate = form.scheduleDate < todayIso()
  const now = new Date()
  const currentHHmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const isStartTimePast = isToday && form.startTime < currentHHmm
  const isEndTimeInvalid = Boolean(form.endTime && form.endTime <= form.startTime)

  const presets = [
    { label: '5h - 6h Sáng', start: '05:00', end: '06:00', period: 'Sáng sớm' },
    { label: '6h - 7h Sáng', start: '06:00', end: '07:00', period: 'Sáng sớm' },
    { label: '7h - 8h Sáng', start: '07:00', end: '08:00', period: 'Sáng' },
    { label: '11h30 - 12h30 Trưa', start: '11:30', end: '12:30', period: 'Trưa' },
    { label: '5h - 6h Chiều (17h - 18h)', start: '17:00', end: '18:00', period: 'Chiều' },
    { label: '6h - 7h Chiều (18h - 19h)', start: '18:00', end: '19:00', period: 'Chiều' },
    { label: '7h - 8h Tối (19h - 20h)', start: '19:00', end: '20:00', period: 'Tối' },
  ]

  return (
    <div className="space-y-5">
      {/* Today's Schedules List */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-strong)] flex items-center gap-1.5">
            <Clock size={14} className="text-amber-500" />
            Lịch hẹn của {selectedMember?.memberName ?? 'học viên'} hôm nay ({selectedSchedules.length})
          </h3>
          <span className="text-xs font-semibold text-[var(--text-muted)]">{formatDate(todayIso())}</span>
        </div>

        <div className="space-y-2">
          {selectedSchedules.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--line)] p-4 text-center text-xs font-semibold text-[var(--text-muted)]">
              Chưa có lịch hẹn nào hôm nay cho học viên này. Hãy thêm lịch bên dưới.
            </p>
          ) : (
            selectedSchedules.map((sch) => (
              <div key={sch.id} className="group rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 hover:border-amber-500/40 transition-colors flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="rounded-lg bg-amber-500/15 text-amber-500 border border-amber-500/30 px-2.5 py-1 text-xs font-black shrink-0">
                    {formatTimeShort(sch.startTime)} – {formatTimeShort(sch.endTime) || '?'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-[var(--text-strong)] truncate">
                      {sch.memberName ?? 'Buổi tập chung'}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">PT: {sch.ptFullName} {sch.note ? `• ${sch.note}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black">
                    {statusLabel(sch.status, scheduleStatusLabels)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRequestReschedule(sch)}
                    title="Đổi giờ (Xoá lịch này và chọn giờ mới)"
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-400 hover:bg-amber-500 hover:text-black transition-all active:scale-95"
                  >
                    <RefreshCcw size={12} />
                    <span className="hidden sm:inline">Đổi giờ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRequestDelete(sch)}
                    title="Xoá lịch hẹn này"
                    className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-400 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                  >
                    <Trash2 size={12} />
                    <span className="hidden sm:inline">Xoá</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add New Schedule Form */}
      <form id="pt-schedule-booking-form" onSubmit={(e) => void onSubmit(e)} className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/20 p-4 space-y-3.5">
        <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-strong)] flex items-center gap-1.5">
          <CalendarClock size={14} className="text-amber-500" />
          Đặt lịch buổi dạy mới
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Chọn học viên</label>
            <select
              value={form.memberId}
              onChange={(e) => onSelectMember(e.target.value ? Number(e.target.value) : null)}
              className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
              required
            >
              <option value="">-- Chọn học viên --</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.memberId}>{a.memberName} ({a.memberPhone})</option>
              ))}
            </select>
          </div>

          <DatePartsSelect
            label="Ngày tập"
            value={form.scheduleDate}
            onChange={(value) => setForm((current) => ({ ...current, scheduleDate: value }))}
            minIso={todayIso()}
            required
            labelClassName="text-[11px] font-bold text-[var(--text-muted)] block"
            selectClassName="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-2 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
          />
        </div>

        {/* Time Presets */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-[var(--text-muted)] block">
              Khung giờ nhanh
            </label>
            {isToday ? (
              <span className="text-[10px] font-semibold text-amber-500/80">
                (Hiện tại: {currentHHmm})
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => {
              const isActive = form.startTime === preset.start && form.endTime === preset.end
              const [pH, pM] = preset.start.split(':').map(Number)
              const presetMinutes = pH * 60 + pM
              const isPast = isToday && presetMinutes <= currentMinutes

              return (
                <button
                  key={preset.start}
                  type="button"
                  onClick={() => applyTimePreset(preset.start, preset.end)}
                  className={[
                    'rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-all flex items-center gap-1.5',
                    isActive
                      ? 'border-amber-400 bg-amber-400/20 text-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)] font-black'
                      : isPast
                        ? 'border-[var(--line)] bg-[var(--surface-muted)]/40 text-[var(--text-muted)] opacity-60 hover:opacity-100 hover:border-amber-400/50'
                        : 'border-[var(--line)] bg-[var(--surface)] text-[var(--text-strong)] hover:border-amber-400 hover:bg-[var(--surface-muted)]',
                  ].join(' ')}
                  title={isPast ? `Khung giờ ${preset.start} đã qua so với hiện tại (${currentHHmm})` : undefined}
                >
                  <span>{preset.label}</span>
                  {isPast ? (
                    <span className="text-[9px] font-bold rounded bg-zinc-500/20 text-zinc-400 px-1 py-0.2">
                      Đã qua
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">
              Giờ bắt đầu {isToday ? <span className="text-amber-500 font-normal">(từ {currentHHmm})</span> : null}
            </label>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm((c) => ({ ...c, startTime: e.target.value }))}
              className={[
                'h-10 w-full rounded-xl border bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none transition-all',
                isStartTimePast
                  ? 'border-rose-500/80 text-rose-400 focus:border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                  : 'border-[var(--line)] focus:border-[var(--brand-yellow)]',
              ].join(' ')}
              required
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Giờ kết thúc</label>
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm((c) => ({ ...c, endTime: e.target.value }))}
              className={[
                'h-10 w-full rounded-xl border bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none transition-all',
                isEndTimeInvalid
                  ? 'border-amber-500/80 text-amber-400 focus:border-amber-500'
                  : 'border-[var(--line)] focus:border-[var(--brand-yellow)]',
              ].join(' ')}
            />
          </div>
        </div>

        {/* Validation Warning Callouts */}
        {isStartTimePast ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>
                Giờ bắt đầu (<strong>{form.startTime}</strong>) đã qua so với thời điểm hiện tại (<strong>{currentHHmm}</strong>). Vui lòng chọn giờ sau {currentHHmm} hoặc đặt cho ngày mai.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setForm((c) => ({ ...c, scheduleDate: addDaysIso(1) }))
              }}
              className="shrink-0 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-2.5 py-1 text-xs font-black transition-all"
            >
              Chuyển sang ngày mai
            </button>
          </div>
        ) : null}

        {isEndTimeInvalid ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs font-bold text-amber-400 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-amber-400" />
            <span>Giờ kết thúc ({form.endTime}) phải sau giờ bắt đầu ({form.startTime}).</span>
          </div>
        ) : null}

        {isPastDate ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs font-bold text-rose-400 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-400" />
            <span>Không thể đặt lịch dạy cho ngày trong quá khứ ({formatDate(form.scheduleDate)}).</span>
          </div>
        ) : null}

        <div>
          <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Ghi chú lịch tập</label>
          <input
            value={form.note}
            onChange={(e) => setForm((c) => ({ ...c, note: e.target.value }))}
            placeholder="Nội dung tập: Ngực + Tay trước, mang theo nước..."
            className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || isStartTimePast || isEndTimeInvalid || isPastDate}
          className="h-10 rounded-xl bg-gradient-to-r from-[var(--brand-yellow)] to-amber-500 px-5 text-xs font-black text-black shadow-sm hover:brightness-105 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? 'Đang lưu lịch...' : 'Xác nhận đặt lịch dạy'}
        </button>
      </form>
    </div>
  )
}

function CheckinPanel({
  detail,
  sessionForm,
  setSessionForm,
  activityForm,
  setActivityForm,
  submitting,
  onSessionSubmit,
  onActivitySubmit,
}: {
  detail: PtMemberDetail | null
  sessionForm: { sessionPackageId: string; sessionDate: string; weight: string; content: string; note: string }
  setSessionForm: Dispatch<SetStateAction<{ sessionPackageId: string; sessionDate: string; weight: string; content: string; note: string }>>
  activityForm: { sessionPackageId: string; activityType: ActivityType; activityDate: string; weight: string; note: string }
  setActivityForm: Dispatch<SetStateAction<{ sessionPackageId: string; activityType: ActivityType; activityDate: string; weight: string; note: string }>>
  submitting: boolean
  onSessionSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
  onActivitySubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
}) {
  const [logType, setLogType] = useState<'PT' | 'PRACTICE'>('PT')

  if (!detail) return <EmptySelect message="Vui lòng chọn học viên để ghi nhận buổi tập." />

  const activePackage = detail.sessionPackages.find((p) => p.status === 'ACTIVE') ?? detail.sessionPackages[0]

  return (
    <div className="space-y-4">
      {/* Student Banner Context */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-lg bg-amber-500 text-black font-black text-xs shrink-0">
            PT
          </div>
          <div>
            <p className="text-xs font-black text-[var(--text-strong)]">
              Đang ghi buổi tập cho: {detail.profile.fullName}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] font-semibold">
              {activePackage ? `${activePackage.planName} • Còn ${activePackage.remainingPtSessions} buổi kèm 1-1` : 'Chưa có gói hiệu lực'}
            </p>
          </div>
        </div>

        {/* Toggle Log Type */}
        <div className="flex rounded-lg border border-[var(--line)] bg-[var(--surface)] p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setLogType('PT')}
            className={`rounded-md px-3 py-1 text-xs font-black transition-all ${
              logType === 'PT' ? 'bg-amber-400 text-black shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'
            }`}
          >
            Buổi kèm 1-1
          </button>
          <button
            type="button"
            onClick={() => setLogType('PRACTICE')}
            className={`rounded-md px-3 py-1 text-xs font-black transition-all ${
              logType === 'PRACTICE' ? 'bg-amber-400 text-black shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'
            }`}
          >
            Tự ôn tập
          </button>
        </div>
      </div>

      {logType === 'PT' ? (
        <form onSubmit={(e) => void onSessionSubmit(e)} className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/20 p-4 space-y-3.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-strong)] flex items-center gap-1.5">
            <Dumbbell size={14} className="text-amber-500" />
            Ghi nhận buổi tập PT kèm 1-1 (Trừ 1 buổi trong gói)
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Gói buổi học</label>
              <select
                value={sessionForm.sessionPackageId}
                onChange={(e) => setSessionForm((c) => ({ ...c, sessionPackageId: e.target.value }))}
                className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
                required
              >
                {detail.sessionPackages.map((p) => (
                  <option key={p.id} value={p.id}>{p.planName} (Còn {p.remainingPtSessions} buổi PT)</option>
                ))}
              </select>
            </div>

            <DatePartsSelect
              label="Ngày tập"
              value={sessionForm.sessionDate}
              onChange={(value) => setSessionForm((current) => ({ ...current, sessionDate: value }))}
              required
              labelClassName="text-[11px] font-bold text-[var(--text-muted)] block"
              selectClassName="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-2 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Cân nặng trước buổi tập (kg)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={sessionForm.weight}
              onChange={(e) => setSessionForm((c) => ({ ...c, weight: e.target.value }))}
              placeholder="Ví dụ: 68.5"
              className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Giáo án & Nội dung tập luyện</label>
            <textarea
              value={sessionForm.content}
              onChange={(e) => setSessionForm((c) => ({ ...c, content: e.target.value }))}
              placeholder="Ví dụ: Lưng xô + Tay trước: Lat Pulldown 4x12 (45kg), Barbell Row 4x10 (50kg), Bicep Curl 3x12..."
              rows={3}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] p-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Nhận xét của PT / Dặn dò dinh dưỡng</label>
            <input
              value={sessionForm.note}
              onChange={(e) => setSessionForm((c) => ({ ...c, note: e.target.value }))}
              placeholder="Thể lực tốt, cần siết thêm cơ lưng, uống đủ 2.5L nước..."
              className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 text-xs font-black text-white shadow-sm hover:brightness-105 active:scale-98 transition-all disabled:opacity-50"
          >
            {submitting ? 'Đang lưu...' : 'Lưu & Trừ 1 buổi PT'}
          </button>
        </form>
      ) : (
        <form onSubmit={(e) => void onActivitySubmit(e)} className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/20 p-4 space-y-3.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-strong)] flex items-center gap-1.5">
            <Activity size={14} className="text-cyan-500" />
            Ghi nhận buổi tự ôn tập / Hướng dẫn
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Hình thức hoạt động</label>
              <select
                value={activityForm.activityType}
                onChange={(e) => setActivityForm((c) => ({ ...c, activityType: e.target.value as ActivityType }))}
                className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
              >
                <option value="PRACTICE">Tự ôn tập theo giáo án</option>
                <option value="GUIDANCE_CHECKIN">Buổi check-in hướng dẫn động tác</option>
              </select>
            </div>

            <DatePartsSelect
              label="Ngày thực hiện"
              value={activityForm.activityDate}
              onChange={(value) => setActivityForm((current) => ({ ...current, activityDate: value }))}
              required
              labelClassName="text-[11px] font-bold text-[var(--text-muted)] block"
              selectClassName="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-2 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Cân nặng (kg)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={activityForm.weight}
              onChange={(e) => setActivityForm((c) => ({ ...c, weight: e.target.value }))}
              placeholder="Ví dụ: 68.2"
              className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Ghi chú tự tập</label>
            <input
              value={activityForm.note}
              onChange={(e) => setActivityForm((c) => ({ ...c, note: e.target.value }))}
              placeholder="Tập Cardio 30p, gập bụng 4 set..."
              className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="h-10 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 text-xs font-black text-white shadow-sm hover:brightness-105 active:scale-98 transition-all disabled:opacity-50"
          >
            {submitting ? 'Đang lưu...' : 'Lưu hoạt động ôn tập'}
          </button>
        </form>
      )}

      {/* Workout Logs History List */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/20 p-4 space-y-2.5">
        <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-strong)]">
          Lịch sử các buổi tập đã ghi nhận ({detail.sessionLogs.length})
        </h4>
        <div className="space-y-2">
          {detail.sessionLogs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--line)] p-4 text-center text-xs font-semibold text-[var(--text-muted)]">
              Chưa có buổi tập nào được ghi nhận cho học viên này.
            </p>
          ) : (
            detail.sessionLogs.map((log, index) => (
              <div key={log.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid size-7 place-items-center rounded-lg bg-amber-500/15 text-amber-500 font-black text-[11px] shrink-0">
                    #{detail.sessionLogs.length - index}
                  </span>
                  <div className="min-w-0">
                    <p className="font-black text-[var(--text-strong)] truncate">
                      {log.content ?? 'Buổi tập có HLV kèm'}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {formatDate(log.sessionDate)} {log.weight ? `• ${log.weight} kg` : ''} {log.note ? `• ${log.note}` : ''}
                    </p>
                  </div>
                </div>
                <span className="rounded bg-emerald-500/15 text-emerald-500 px-2 py-0.5 text-[10px] font-black shrink-0">
                  {statusLabel(log.status, sessionStatusLabels)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function MeasurementPanel({
  detail,
  form,
  setForm,
  submitting,
  onSubmit,
}: {
  detail: PtMemberDetail | null
  form: { recordedAt: string; weight: string; chest: string; waist: string; abdomen: string; hip: string; thigh: string; arm: string; note: string }
  setForm: Dispatch<SetStateAction<{ recordedAt: string; weight: string; chest: string; waist: string; abdomen: string; hip: string; thigh: string; arm: string; note: string }>>
  submitting: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
}) {
  if (!detail) return <EmptySelect message="Vui lòng chọn học viên để theo dõi chỉ số cơ thể." />

  const latest = detail.bodyMeasurements[0] ?? null
  const earliest = detail.bodyMeasurements[detail.bodyMeasurements.length - 1] ?? null
  const weightDiff = latest?.weight && earliest?.weight && latest !== earliest ? latest.weight - earliest.weight : null

  return (
    <div className="space-y-5">
      {/* Current Metric Highlights */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-strong)]">
            Chỉ số cơ thể đo đạc gần nhất
          </h4>
          {latest ? (
            <span className="text-[11px] font-semibold text-[var(--text-muted)]">
              Đo ngày {formatDate(latest.recordedAt)}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-7">
          <MetricChip label="Cân nặng" value={latest?.weight ? `${latest.weight} kg` : '-'} diff={weightDiff} />
          <MetricChip label="Vòng eo" value={latest?.waist ? `${latest.waist} cm` : '-'} />
          <MetricChip label="Vòng ngực" value={latest?.chest ? `${latest.chest} cm` : '-'} />
          <MetricChip label="Vòng bụng" value={latest?.abdomen ? `${latest.abdomen} cm` : '-'} />
          <MetricChip label="Vòng mông" value={latest?.hip ? `${latest.hip} cm` : '-'} />
          <MetricChip label="Vòng đùi" value={latest?.thigh ? `${latest.thigh} cm` : '-'} />
          <MetricChip label="Bắp tay" value={latest?.arm ? `${latest.arm} cm` : '-'} />
        </div>
      </div>

      {/* Add New Measurement Form */}
      <form onSubmit={(e) => void onSubmit(e)} className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/20 p-4 space-y-3.5">
        <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-strong)] flex items-center gap-1.5">
          <Ruler size={14} className="text-purple-500" />
          Cập nhật số đo mới
        </h3>

        <div className="grid gap-3 sm:grid-cols-3">
          <DatePartsSelect
            label="Ngày đo"
            value={form.recordedAt}
            onChange={(value) => setForm((current) => ({ ...current, recordedAt: value }))}
            required
            labelClassName="text-[11px] font-bold text-[var(--text-muted)] block"
            selectClassName="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-2 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
          />
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Cân nặng (kg)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={form.weight}
              onChange={(e) => setForm((c) => ({ ...c, weight: e.target.value }))}
              placeholder="VD: 65.5"
              className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Vòng ngực (cm)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={form.chest}
              onChange={(e) => setForm((c) => ({ ...c, chest: e.target.value }))}
              placeholder="VD: 95"
              className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Vòng eo (cm)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={form.waist}
              onChange={(e) => setForm((c) => ({ ...c, waist: e.target.value }))}
              placeholder="VD: 74"
              className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Vòng bụng (cm)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={form.abdomen}
              onChange={(e) => setForm((c) => ({ ...c, abdomen: e.target.value }))}
              placeholder="VD: 78"
              className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Vòng mông (cm)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={form.hip}
              onChange={(e) => setForm((c) => ({ ...c, hip: e.target.value }))}
              placeholder="VD: 96"
              className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Vòng đùi (cm)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={form.thigh}
              onChange={(e) => setForm((c) => ({ ...c, thigh: e.target.value }))}
              placeholder="VD: 55"
              className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Bắp tay (cm)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={form.arm}
              onChange={(e) => setForm((c) => ({ ...c, arm: e.target.value }))}
              placeholder="VD: 34"
              className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Ghi chú đo đạc</label>
          <input
            value={form.note}
            onChange={(e) => setForm((c) => ({ ...c, note: e.target.value }))}
            placeholder="Đo vào buổi sáng khi chưa ăn, đo bằng thước dây chuẩn..."
            className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 text-xs font-black text-white shadow-sm hover:brightness-105 active:scale-98 transition-all disabled:opacity-50"
        >
          {submitting ? 'Đang lưu...' : 'Lưu chỉ số cơ thể'}
        </button>
      </form>

      {/* Measurement History Table */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/20 p-4 space-y-2.5">
        <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-strong)]">
          Lịch sử đo đạc ({detail.bodyMeasurements.length})
        </h4>
        <div className="space-y-1.5">
          {detail.bodyMeasurements.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--line)] p-4 text-center text-xs font-semibold text-[var(--text-muted)]">
              Chưa có số đo nào được lưu.
            </p>
          ) : (
            detail.bodyMeasurements.map((m) => (
              <div key={m.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                <span className="font-black text-amber-500 shrink-0">{formatDate(m.recordedAt)}</span>
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[var(--text-strong)]">
                  <span>Cân nặng: <strong className="text-emerald-500">{m.weight ?? '-'} kg</strong></span>
                  <span>Eo: <strong>{m.waist ?? '-'} cm</strong></span>
                  <span>Ngực: <strong>{m.chest ?? '-'} cm</strong></span>
                  <span>Mông: <strong>{m.hip ?? '-'} cm</strong></span>
                  <span>Đùi: <strong>{m.thigh ?? '-'} cm</strong></span>
                  <span>Tay: <strong>{m.arm ?? '-'} cm</strong></span>
                </div>
                {m.note ? <span className="text-[10px] text-[var(--text-muted)] truncate max-w-xs">{m.note}</span> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function MetricChip({ label, value, diff }: { label: string; value: string; diff?: number | null }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2.5 text-center">
      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{label}</p>
      <p className="text-base font-black text-[var(--text-strong)] mt-0.5">{value}</p>
      {diff !== undefined && diff !== null ? (
        <span className={`text-[10px] font-bold flex items-center justify-center gap-0.5 mt-0.5 ${diff < 0 ? 'text-emerald-500' : diff > 0 ? 'text-rose-500' : 'text-zinc-400'}`}>
          {diff < 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
          {diff > 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`} kg
        </span>
      ) : null}
    </div>
  )
}

function GoalPanel({
  detail,
  form,
  setForm,
  submitting,
  onSubmit,
}: {
  detail: PtMemberDetail | null
  form: { goalType: GoalType; goalDescription: string; targetDate: string; targetWeight: string; targetWaist: string; note: string }
  setForm: Dispatch<SetStateAction<{ goalType: GoalType; goalDescription: string; targetDate: string; targetWeight: string; targetWaist: string; note: string }>>
  submitting: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
}) {
  if (!detail) return <EmptySelect message="Vui lòng chọn học viên để quản lý mục tiêu." />

  return (
    <div className="space-y-5">
      {/* Active Goals Display */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-strong)]">
          Mục tiêu huấn luyện đang theo đuổi ({detail.goals.length})
        </h4>

        {detail.goals.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--line)] p-5 text-center text-xs font-semibold text-[var(--text-muted)]">
            Học viên chưa có mục tiêu nào được thiết lập. Hãy tạo lộ trình mục tiêu bên dưới.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {detail.goals.map((goal) => {
              const meta = goalTypeLabels[goal.goalType] ?? goalTypeLabels.OTHER
              const Icon = meta.icon

              return (
                <div key={goal.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/30 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-black text-[var(--text-strong)]">
                      <Icon size={15} className={meta.color} />
                      {meta.label}
                    </span>
                    <span className="rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black">
                      Đang thực hiện
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    {goal.targetWeight ? (
                      <div className="rounded-lg bg-[var(--surface)] p-2">
                        <span className="text-[10px] text-[var(--text-muted)] block">Cân nặng mục tiêu</span>
                        <span className="text-sm font-black text-amber-500">{goal.targetWeight} kg</span>
                      </div>
                    ) : null}
                    {goal.targetWaist ? (
                      <div className="rounded-lg bg-[var(--surface)] p-2">
                        <span className="text-[10px] text-[var(--text-muted)] block">Vòng eo mục tiêu</span>
                        <span className="text-sm font-black text-purple-500">{goal.targetWaist} cm</span>
                      </div>
                    ) : null}
                  </div>

                  {goal.goalDescription ? (
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed italic bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--line)]/50">
                      &quot;{goal.goalDescription}&quot;
                    </p>
                  ) : null}

                  <div className="text-[10px] font-semibold text-[var(--text-muted)] flex items-center justify-between border-t border-[var(--line)] pt-2">
                    <span>Khởi động: {formatDate(goal.startDate)}</span>
                    <span>Đích đến: {formatDate(goal.targetDate)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Set New Goal Form */}
      <form onSubmit={(e) => void onSubmit(e)} className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/20 p-4 space-y-3.5">
        <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-strong)] flex items-center gap-1.5">
          <Target size={14} className="text-rose-500" />
          Thiết lập mục tiêu huấn luyện mới
        </h3>

        {/* Goal Type Chips */}
        <div>
          <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1.5">Loại mục tiêu</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(Object.keys(goalTypeLabels) as GoalType[]).map((type) => {
              const item = goalTypeLabels[type]
              const Icon = item.icon
              const isSelected = form.goalType === type

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((c) => ({ ...c, goalType: type }))}
                  className={[
                    'rounded-xl border p-2.5 text-left text-xs font-black transition-all flex items-center gap-2',
                    isSelected
                      ? 'border-amber-400 bg-amber-400/15 text-[var(--text-strong)] shadow-sm'
                      : 'border-[var(--line)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-amber-400/40',
                  ].join(' ')}
                >
                  <Icon size={14} className={item.color} />
                  <span className="truncate">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <DatePartsSelect
            label="Ngày dự kiến đạt mục tiêu"
            value={form.targetDate}
            onChange={(value) => setForm((current) => ({ ...current, targetDate: value }))}
            allowEmpty
            labelClassName="text-[11px] font-bold text-[var(--text-muted)] block"
            selectClassName="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-2 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
          />
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Cân nặng mục tiêu (kg)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={form.targetWeight}
              onChange={(e) => setForm((c) => ({ ...c, targetWeight: e.target.value }))}
              placeholder="VD: 60"
              className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Vòng eo mục tiêu (cm)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={form.targetWaist}
              onChange={(e) => setForm((c) => ({ ...c, targetWaist: e.target.value }))}
              placeholder="VD: 70"
              className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Kế hoạch & Mô tả lộ trình</label>
          <textarea
            value={form.goalDescription}
            onChange={(e) => setForm((c) => ({ ...c, goalDescription: e.target.value }))}
            placeholder="Ví dụ: Giảm 4kg mỡ trong 2 tháng, tập 3 buổi PT/tuần, cắt tinh bột sau 19h..."
            rows={3}
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] p-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="h-10 rounded-xl bg-gradient-to-r from-rose-600 via-amber-600 to-amber-500 px-5 text-xs font-black text-white shadow-sm hover:brightness-105 active:scale-98 transition-all disabled:opacity-50"
        >
          {submitting ? 'Đang lưu...' : 'Lưu mục tiêu huấn luyện'}
        </button>
      </form>
    </div>
  )
}

function DeleteScheduleModal({
  schedule,
  submitting,
  onClose,
  onConfirmDelete,
  onConfirmReschedule,
}: {
  schedule: PtSchedule
  submitting: boolean
  onClose: () => void
  onConfirmDelete: (schedule: PtSchedule) => Promise<void>
  onConfirmReschedule: (schedule: PtSchedule) => Promise<void>
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[var(--surface)] p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-red-500/15 text-red-400 border border-red-500/30">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-[var(--text-strong)]">Xác nhận huỷ lịch dạy</h3>
              <p className="text-xs text-[var(--text-muted)]">Giải phóng khung giờ hoặc đổi giờ hẹn mới</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-[var(--text-muted)] hover:text-[var(--text-strong)] p-1 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Schedule info card */}
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/50 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-500">
              {formatTimeShort(schedule.startTime)} – {formatTimeShort(schedule.endTime) || '?'}
            </span>
            <span className="text-xs font-bold text-[var(--text-muted)]">
              {formatDate(schedule.scheduleDate)}
            </span>
          </div>
          <p className="text-sm font-black text-[var(--text-strong)]">
            Học viên: {schedule.memberName ?? 'Buổi tập chung'}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            PT phụ trách: <strong>{schedule.ptFullName}</strong>
            {schedule.note ? ` • Ghi chú: "${schedule.note}"` : ''}
          </p>
        </div>

        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Bạn muốn <strong className="text-red-400">xoá hẳn</strong> lịch này hay <strong className="text-amber-400">xoá để đặt lại giờ mới</strong> ngay cho học viên?
        </p>

        {/* Action buttons */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void onConfirmReschedule(schedule)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--brand-yellow)] via-amber-500 to-amber-600 px-4 py-2.5 text-xs font-black text-black shadow-lg shadow-amber-500/20 hover:brightness-105 transition-all disabled:opacity-50 active:scale-[0.99]"
          >
            <RefreshCcw size={14} className={submitting ? 'animate-spin' : ''} />
            <span>Xoá & Đặt lại giờ mới ngay</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-strong)] transition-colors"
            >
              Giữ lại lịch
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void onConfirmDelete(schedule)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/15 px-3 py-2 text-xs font-black text-red-400 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 active:scale-[0.99]"
            >
              <Trash2 size={13} />
              <span>{submitting ? 'Đang xoá...' : 'Xác nhận xoá'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptySelect({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center space-y-2">
      <UserCheck size={28} className="mx-auto text-[var(--text-muted)] opacity-60" />
      <p className="text-xs font-semibold text-[var(--text-muted)]">{message}</p>
    </div>
  )
}
