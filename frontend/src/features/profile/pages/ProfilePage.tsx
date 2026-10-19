import {
  Activity,
  CheckCircle2,
  Eye,
  EyeOff,
  Hash,
  KeyRound,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { ApiClientError } from '../../../shared/api/apiClient'
import { clearAccessToken } from '../../../shared/lib/authStorage'
import { fixVietnameseMojibake } from '../../../shared/lib/text'
import { changePassword } from '../../auth/api/authApi'
import { useAuth } from '../../auth/context/authContext'

const roleLabels: Record<string, string> = {
  OWNER: 'Chủ phòng',
  PT: 'Huấn luyện viên',
  MEMBER: 'Hội viên',
}

const roleDescriptions: Record<string, string> = {
  OWNER: 'Tài khoản quản lý vận hành và phân quyền nhân sự phòng gym.',
  PT: 'Tài khoản Huấn luyện viên cá nhân, phụ trách theo dõi thể trạng và lịch tập của học viên.',
  MEMBER: 'Tài khoản Hội viên, theo dõi tiến độ tập luyện, lịch hẹn và các gói dịch vụ cá nhân.',
}

function errorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message
  }
  return 'Không thể xử lý yêu cầu. Vui lòng thử lại.'
}

export function ProfilePage() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const displayName = fixVietnameseMojibake(user?.fullName)

  const initials = displayName
    ?.split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || 'U'
  const primaryRole = user?.roles[0] ?? 'USER'
  const roleLabel = roleLabels[primaryRole] ?? primaryRole

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu chưa trùng khớp.')
      return
    }

    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.')
      return
    }

    try {
      setSubmitting(true)
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      clearAccessToken()
      setSuccess('Đã đổi mật khẩu. Vui lòng đăng nhập lại.')
      window.setTimeout(() => window.location.replace('/login'), 1200)
    } catch (submitError) {
      setError(errorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 animate-in fade-in duration-200">
      {/* Compact Hero Banner with Glassmorphism */}
      <section className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6 shadow-sm">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-16 h-48 w-48 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar Squircle */}
            <div className="relative grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--brand-yellow)] to-amber-500 text-2xl font-black text-black shadow-md">
              {initials}
              <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-black text-amber-400 border border-amber-500/40 shadow-sm">
                <ShieldCheck size={13} />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Hồ sơ tài khoản
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Đang hoạt động
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--text-strong)] tracking-tight">
                {displayName}
              </h1>
              <p className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--text-muted)]">
                <Mail size={14} className="text-amber-400 shrink-0" />
                <span>{user?.email}</span>
              </p>
            </div>
          </div>

          {/* Role Badge */}
          <div className="self-start sm:self-auto rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-left sm:text-right shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Vai trò hiện tại</p>
            <p className="text-base font-black text-amber-400 mt-0.5 flex items-center gap-1.5 sm:justify-end">
              <ShieldCheck size={16} />
              <span>{roleLabel}</span>
            </p>
          </div>
        </div>
      </section>

      {/* 2 Equal Columns: Account Details & Change Password */}
      <section className="grid gap-4 lg:grid-cols-2 items-stretch">
        {/* Left Column: Account Information */}
        <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--line)]">
              <span className="grid size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                <UserRound size={18} />
              </span>
              <div>
                <h2 className="text-base font-black text-[var(--text-strong)]">Thông tin tài khoản</h2>
                <p className="text-xs font-semibold text-[var(--text-muted)]">
                  Chi tiết tài khoản đăng nhập và phân quyền hệ thống
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2.5">
              <InfoRow icon={UserRound} label="Họ và tên" value={displayName || '-'} />
              <InfoRow icon={Mail} label="Email đăng nhập" value={user?.email ?? '-'} />
              <InfoRow icon={Hash} label="Mã tài khoản" value={user?.id ? `#${user.id}` : '-'} />
              <InfoRow icon={ShieldCheck} label="Vai trò hệ thống" value={roleLabel} highlight />
              <InfoRow icon={Activity} label="Trạng thái tài khoản" value="Đang hoạt động" tone="success" />
            </div>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/50 p-3 text-xs font-semibold text-[var(--text-muted)] leading-relaxed">
            {roleDescriptions[primaryRole] ?? 'Tài khoản hoạt động trong hệ thống quản lý phòng gym.'}
          </div>
        </article>

        {/* Right Column: Change Password Form */}
        <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--line)]">
              <span className="grid size-9 place-items-center rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 shrink-0">
                <KeyRound size={18} />
              </span>
              <div>
                <h2 className="text-base font-black text-[var(--text-strong)]">Đổi mật khẩu</h2>
                <p className="text-xs font-semibold text-[var(--text-muted)]">
                  Cập nhật mật khẩu bảo mật cho tài khoản của bạn
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              {error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs sm:text-sm font-bold text-red-400 shadow-sm animate-in fade-in">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs sm:text-sm font-bold text-emerald-400 shadow-sm animate-in fade-in flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{success}</span>
                </div>
              ) : null}

              {/* Current Password */}
              <div>
                <label className="text-xs font-bold text-[var(--text-strong)] block mb-1">
                  Mật khẩu hiện tại <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] pl-3 pr-10 text-xs sm:text-sm font-semibold outline-none focus:border-amber-400 transition-all placeholder:text-[var(--text-muted)]/50"
                    placeholder="Nhập mật khẩu hiện tại"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-strong)] transition-colors"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="text-xs font-bold text-[var(--text-strong)] block mb-1">
                  Mật khẩu mới <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] pl-3 pr-10 text-xs sm:text-sm font-semibold outline-none focus:border-amber-400 transition-all placeholder:text-[var(--text-muted)]/50"
                    placeholder="Tối thiểu 8 ký tự"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-strong)] transition-colors"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-xs font-bold text-[var(--text-strong)] block mb-1">
                  Xác nhận mật khẩu mới <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] pl-3 pr-10 text-xs sm:text-sm font-semibold outline-none focus:border-amber-400 transition-all placeholder:text-[var(--text-muted)]/50"
                    placeholder="Nhập lại mật khẩu mới"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-strong)] transition-colors"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--brand-yellow)] to-amber-500 px-4 text-xs sm:text-sm font-black text-black shadow-md hover:brightness-105 active:scale-98 transition-all disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>{submitting ? 'Đang lưu...' : 'Lưu mật khẩu mới'}</span>
                </button>
              </div>
            </form>
          </div>
        </article>
      </section>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  highlight = false,
  tone = 'default',
}: {
  icon: typeof UserRound
  label: string
  value: string
  highlight?: boolean
  tone?: 'default' | 'success'
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/40 p-3 hover:border-amber-400/30 hover:bg-[var(--surface-muted)] transition-all">
      <div className="flex items-center gap-2.5">
        <span className="grid size-7 place-items-center rounded-lg bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--line)]">
          <Icon size={14} />
        </span>
        <span className="text-xs font-semibold text-[var(--text-muted)]">{label}</span>
      </div>
      <span
        className={`text-xs sm:text-sm font-black ${
          tone === 'success'
            ? 'text-emerald-400'
            : highlight
              ? 'text-amber-400'
              : 'text-[var(--text-strong)]'
        }`}
      >
        {value}
      </span>
    </div>
  )
}
