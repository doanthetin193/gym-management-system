import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  KeyRound,
  Lock,
  QrCode,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { ApiClientError } from '../../../shared/api/apiClient'
import { fixVietnameseMojibake } from '../../../shared/lib/text'
import { useAuth } from '../../auth/context/authContext'
import {
  createTeamUser,
  listTeamUsers,
  resetTeamPassword,
  updateTeamRole,
  updateTeamStatus,
} from '../api/teamUserApi'
import { getVietQrSetting, updateVietQrSetting } from '../api/settingsApi'
import { buildTransferContent, buildVietQrImageUrl } from '../lib/vietQr'
import type { VietQrSetting } from '../types/settings'
import type { CreateTeamUserPayload, TeamUser, TeamUserRole } from '../types/teamUser'

const bankOptions = [
  { code: 'BIDV', name: 'BIDV - Đầu tư & Phát triển VN' },
  { code: 'VCB', name: 'Vietcombank - Ngoại thương VN' },
  { code: 'VietinBank', name: 'VietinBank - Công thương VN' },
  { code: 'MB', name: 'MBBank - Quân đội' },
  { code: 'TCB', name: 'Techcombank - Kỹ thương VN' },
  { code: 'ACB', name: 'ACB - Á Châu' },
  { code: 'VPB', name: 'VPBank - Việt Nam Thịnh Vượng' },
  { code: 'TPB', name: 'TPBank - Tiên Phong' },
]

const defaultSetting: VietQrSetting = {
  enabled: true,
  bankCode: 'BIDV',
  bankName: 'BIDV - Đầu tư & Phát triển VN',
  accountNumber: '',
  accountName: '',
  transferPrefix: 'GYMDD',
  template: 'compact2',
}

function generateTemporaryPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$'
  const bytes = new Uint32Array(10)
  window.crypto.getRandomValues(bytes)
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  return `${letters[bytes[0] % letters.length]}${digits[bytes[1] % digits.length]}${Array.from(bytes.slice(2), (value) => chars[value % chars.length]).join('')}`
}

function errorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message
  }
  return 'Không thể xử lý yêu cầu. Vui lòng thử lại.'
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

function formatLastLogin(value: string | null) {
  if (!value) {
    return 'Chưa đăng nhập'
  }
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

export function SettingsPage() {
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'team' | 'vietqr'>('team')

  // Team account state
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([])
  const [loadingTeamUsers, setLoadingTeamUsers] = useState(true)
  const [teamUserError, setTeamUserError] = useState<string | null>(null)
  const [teamUserSuccess, setTeamUserSuccess] = useState<string | null>(null)

  // Team account modals
  const [isAddTeamUserOpen, setIsAddTeamUserOpen] = useState(false)
  const [addTeamUserSubmitting, setAddTeamUserSubmitting] = useState(false)
  const [newTeamUserForm, setNewTeamUserForm] = useState<CreateTeamUserPayload>({
    email: '',
    fullName: '',
    phone: '',
    roleCode: 'PT',
    password: generateTemporaryPassword(),
  })

  const [resettingUser, setResettingUser] = useState<TeamUser | null>(null)
  const [newPasswordInput, setNewPasswordInput] = useState(generateTemporaryPassword)
  const [resetSubmitting, setResetSubmitting] = useState(false)

  // VietQR state
  const [form, setForm] = useState<VietQrSetting>(defaultSetting)
  const [loadingQr, setLoadingQr] = useState(true)
  const [savingQr, setSavingQr] = useState(false)
  const [qrError, setQrError] = useState<string | null>(null)
  const [qrSuccess, setQrSuccess] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const previewContent = useMemo(() => buildTransferContent(form, 'Nguyen Van A', 12), [form])
  const previewUrl = useMemo(
    () => buildVietQrImageUrl({ setting: { ...form, enabled: true }, amount: 300000, addInfo: previewContent }),
    [form, previewContent],
  )

  useEffect(() => {
    void loadTeamUsers()
    void loadVietQr()
  }, [])

  async function loadTeamUsers() {
    setLoadingTeamUsers(true)
    setTeamUserError(null)
    try {
      const data = await listTeamUsers()
      setTeamUsers(data.map((account) => ({ ...account, fullName: fixVietnameseMojibake(account.fullName) })))
    } catch (err) {
      setTeamUserError(errorMessage(err))
    } finally {
      setLoadingTeamUsers(false)
    }
  }

  async function loadVietQr() {
    setLoadingQr(true)
    setQrError(null)
    try {
      const loaded = await getVietQrSetting()
      setForm({ ...loaded, enabled: true })
    } catch (err) {
      setQrError(errorMessage(err))
    } finally {
      setLoadingQr(false)
    }
  }

  // Team account handlers
  async function handleCreateTeamUser(event: FormEvent) {
    event.preventDefault()
    setAddTeamUserSubmitting(true)
    setTeamUserError(null)
    try {
      await createTeamUser(newTeamUserForm)
      setIsAddTeamUserOpen(false)
      setNewTeamUserForm({
        email: '',
        fullName: '',
        phone: '',
        roleCode: 'PT',
        password: generateTemporaryPassword(),
      })
      setTeamUserSuccess('Đã cấp tài khoản nhân sự mới thành công!')
      setTimeout(() => setTeamUserSuccess(null), 4000)
      await loadTeamUsers()
    } catch (err) {
      setTeamUserError(errorMessage(err))
    } finally {
      setAddTeamUserSubmitting(false)
    }
  }

  async function handleRoleChange(account: TeamUser, newRole: TeamUserRole) {
    if (account.roleCode === newRole) return
    const isSelf = currentUser && account.id === currentUser.id
    if (isSelf && newRole !== 'OWNER') {
      alert('Bạn không thể tự hạ quyền Chủ phòng của chính mình.')
      return
    }
    const confirmMsg =
      newRole === 'OWNER'
        ? `Nâng quyền cho "${account.fullName}" lên thành CHỦ PHÒNG (Toàn quyền quản trị)?`
        : `Chuyển quyền "${account.fullName}" về Huấn luyện viên (PT)?`
    if (!window.confirm(confirmMsg)) return

    try {
      await updateTeamRole(account.id, newRole)
      setTeamUserSuccess(`Đã cập nhật vai trò cho "${account.fullName}" thành công!`)
      setTimeout(() => setTeamUserSuccess(null), 3000)
      await loadTeamUsers()
    } catch (err) {
      setTeamUserError(errorMessage(err))
    }
  }

  async function handleToggleStatus(account: TeamUser) {
    const isSelf = currentUser && account.id === currentUser.id
    if (isSelf) {
      alert('Bạn không thể tự khóa tài khoản của chính mình.')
      return
    }
    const nextStatus = account.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE'
    const confirmMsg =
      nextStatus === 'LOCKED'
        ? `Khóa quyền đăng nhập của "${account.fullName}"? Nhân sự này sẽ không thể vào hệ thống nữa.`
        : `Mở khóa đăng nhập cho "${account.fullName}"?`
    if (!window.confirm(confirmMsg)) return

    try {
      await updateTeamStatus(account.id, nextStatus)
      setTeamUserSuccess(`Đã ${nextStatus === 'ACTIVE' ? 'mở khóa' : 'khóa'} tài khoản "${account.fullName}"!`)
      setTimeout(() => setTeamUserSuccess(null), 3000)
      await loadTeamUsers()
    } catch (err) {
      setTeamUserError(errorMessage(err))
    }
  }

  async function handleResetPassword(event: FormEvent) {
    event.preventDefault()
    if (!resettingUser) return
    setResetSubmitting(true)
    try {
      await resetTeamPassword(resettingUser.id, newPasswordInput)
      setTeamUserSuccess(`Đã đặt lại mật khẩu cho "${resettingUser.fullName}" thành công! Mật khẩu mới: ${newPasswordInput}`)
      setResettingUser(null)
      setTimeout(() => setTeamUserSuccess(null), 5000)
    } catch (err) {
      setTeamUserError(errorMessage(err))
    } finally {
      setResetSubmitting(false)
    }
  }

  // VietQR handlers
  function handleBankChange(bankCode: string) {
    const selected = bankOptions.find((bank) => bank.code === bankCode)
    setForm((current) => ({
      ...current,
      bankCode,
      bankName: selected?.name ?? current.bankName,
    }))
  }

  async function handleQrSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavingQr(true)
    setQrError(null)
    setQrSuccess(null)
    try {
      const saved = await updateVietQrSetting({ ...form, enabled: true })
      setForm({ ...saved, enabled: true })
      setQrSuccess('Đã lưu cấu hình VietQR thành công!')
      setTimeout(() => setQrSuccess(null), 4000)
    } catch (caughtError) {
      setQrError(errorMessage(caughtError))
    } finally {
      setSavingQr(false)
    }
  }

  async function copyToClipboard(text: string, key: string) {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const ownerCount = teamUsers.filter((s) => s.roleCode === 'OWNER').length
  const ptCount = teamUsers.filter((s) => s.roleCode === 'PT').length

  return (
    <div className="mx-auto max-w-7xl space-y-5 animate-in fade-in duration-200">
      {/* Top Navigation Tabs */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 sm:p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-black transition-all ${
              activeTab === 'team'
                ? 'bg-[var(--brand-yellow)] text-black shadow-md'
                : 'bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text-strong)]'
            }`}
          >
            <Users size={16} />
            <span>Tài khoản PT & Nhân sự</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                activeTab === 'team' ? 'bg-black/15 text-black' : 'bg-[var(--line)] text-[var(--text-muted)]'
              }`}
            >
              {teamUsers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vietqr')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-black transition-all ${
              activeTab === 'vietqr'
                ? 'bg-[var(--brand-yellow)] text-black shadow-md'
                : 'bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text-strong)]'
            }`}
          >
            <CreditCard size={16} />
            <span>Nhận tiền VietQR 24/7</span>
            <span className="inline-flex size-2 rounded-full bg-emerald-400" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-black text-emerald-400">
            <ShieldCheck size={15} />
            <span>Quyền Quản Trị Chủ Phòng</span>
          </span>
        </div>
      </section>

      {/* ================= TAB 1: TEAM ACCOUNT MANAGEMENT ================= */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          {/* Notification Banners */}
          {teamUserSuccess && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs sm:text-sm font-bold text-emerald-400 shadow-sm animate-in fade-in">
              <CheckCircle2 size={17} className="shrink-0" />
              <span>{teamUserSuccess}</span>
            </div>
          )}
          {teamUserError && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs sm:text-sm font-bold text-red-400 shadow-sm animate-in fade-in">
              <AlertCircle size={17} className="shrink-0" />
              <span>{teamUserError}</span>
            </div>
          )}

          {/* Stat Counters & Create Button Header */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Tổng nhân sự</p>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-[var(--text-strong)]">{teamUsers.length}</span>
                <span className="text-xs font-semibold text-[var(--text-muted)]">Tài khoản</span>
              </div>
            </div>

            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Chủ phòng (OWNER)</p>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-blue-400">{ownerCount}</span>
                <span className="text-xs font-semibold text-blue-300">Toàn quyền</span>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Huấn luyện viên (PT)</p>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-400">{ptCount}</span>
                <span className="text-xs font-semibold text-amber-300">Dạy & Quản lý lịch</span>
              </div>
            </div>

            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setIsAddTeamUserOpen(true)}
                className="inline-flex h-full min-h-[72px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-4 text-sm font-black text-black shadow-lg transition-all hover:brightness-105 active:scale-98"
              >
                <UserPlus size={18} />
                <span>+ Cấp Tài Khoản Mới</span>
              </button>
            </div>
          </div>

          {/* Team account list table */}
          <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden shadow-sm">
            <div className="border-b border-[var(--line)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-black text-[var(--text-strong)]">
                  Danh sách tài khoản Huấn luyện viên & Quản trị
                </h2>
                <p className="text-xs font-semibold text-[var(--text-muted)]">
                  Chủ phòng có thể đổi vai trò (PT ↔ Chủ phòng), khóa tài khoản tạm thời hoặc đổi mật khẩu giúp nhân viên.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadTeamUsers()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-strong)] transition"
              >
                <RefreshCw size={13} className={loadingTeamUsers ? 'animate-spin' : ''} />
                Làm mới
              </button>
            </div>

            {loadingTeamUsers ? (
              <div className="p-12 text-center text-sm font-semibold text-[var(--text-muted)]">
                Đang tải danh sách nhân sự...
              </div>
            ) : teamUsers.length === 0 ? (
              <div className="p-12 text-center text-sm font-semibold text-[var(--text-muted)]">
                Chưa có tài khoản nhân sự nào.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-[var(--line)] bg-[var(--surface-muted)] text-[11px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Nhân sự</th>
                      <th className="py-3.5 px-4">Số điện thoại</th>
                      <th className="py-3.5 px-4">Vai trò hệ thống</th>
                      <th className="py-3.5 px-4">Trạng thái</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)] font-medium">
                    {teamUsers.map((account) => {
                      const isSelf = Boolean(currentUser && account.id === currentUser.id)
                      return (
                        <tr key={account.id} className="hover:bg-[var(--surface-muted)]/50 transition-colors">
                          {/* Name & Email */}
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-metric-blue text-sm font-black text-[var(--brand-blue)]">
                                {account.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-[var(--text-strong)] truncate">
                                    {account.fullName}
                                  </span>
                                  {isSelf && (
                                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-400">
                                      Tài khoản của bạn
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-[var(--text-muted)] truncate block">
                                  {account.email}
                                </span>
                                <span className="mt-0.5 block text-[11px] font-semibold text-[var(--text-muted)]">
                                  Lần đăng nhập: {formatLastLogin(account.lastLoginAt)}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Phone */}
                          <td className="py-4 px-4">
                            <span className="font-semibold text-[var(--text-strong)]">
                              {account.phone || '-'}
                            </span>
                          </td>

                          {/* Role Selector */}
                          <td className="py-4 px-4">
                            <select
                              value={account.roleCode}
                              onChange={(e) => void handleRoleChange(account, e.target.value as TeamUserRole)}
                              disabled={isSelf}
                              className={`rounded-lg border px-2.5 py-1 text-xs font-black outline-none transition cursor-pointer ${
                                account.roleCode === 'OWNER'
                                  ? 'border-blue-500/40 bg-blue-500/10 text-blue-400'
                                  : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                              } ${isSelf ? 'cursor-not-allowed opacity-80' : 'hover:brightness-110'}`}
                            >
                              <option value="PT" className="bg-[#12161f] text-amber-400">
                                Huấn luyện viên (PT)
                              </option>
                              <option value="OWNER" className="bg-[#12161f] text-blue-400">
                                Chủ phòng (OWNER)
                              </option>
                            </select>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            <button
                              type="button"
                              onClick={() => void handleToggleStatus(account)}
                              disabled={isSelf}
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black transition ${
                                account.status === 'ACTIVE'
                                  ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                  : 'border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              } ${isSelf ? 'cursor-not-allowed opacity-80' : ''}`}
                            >
                              {account.status === 'ACTIVE' ? (
                                <>
                                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  <span>Đang mở</span>
                                </>
                              ) : (
                                <>
                                  <Lock size={11} />
                                  <span>Đã khóa</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setResettingUser(account)
                                  setNewPasswordInput(generateTemporaryPassword())
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-2.5 py-1.5 text-xs font-bold text-[var(--text)] hover:bg-[var(--surface)] transition"
                                title="Đặt lại mật khẩu giúp nhân viên"
                              >
                                <KeyRound size={13} className="text-amber-400" />
                                <span>Đặt lại MK</span>
                              </button>

                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Modal: Cấp Tài Khoản Mới */}
          {isAddTeamUserOpen && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <UserPlus size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-[var(--text-strong)]">Cấp Tài Khoản Nhân Sự Mới</h3>
                      <p className="text-xs text-[var(--text-muted)]">Tạo tài khoản đăng nhập cho PT hoặc Chủ phòng</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddTeamUserOpen(false)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-strong)] text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={(e) => void handleCreateTeamUser(e)} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-[var(--text-strong)] block mb-1">
                      Họ và tên nhân sự <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newTeamUserForm.fullName}
                      onChange={(e) => setNewTeamUserForm({ ...newTeamUserForm, fullName: e.target.value })}
                      placeholder="VD: Kiệt PT, Nguyễn Văn B..."
                      className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-bold text-[var(--text-strong)] outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--text-strong)] block mb-1">
                      Email đăng nhập <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={newTeamUserForm.email}
                      onChange={(e) => setNewTeamUserForm({ ...newTeamUserForm, email: e.target.value })}
                      placeholder="VD: kiet.pt@gymduongdouble.com"
                      className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-bold text-[var(--text-strong)] outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--text-strong)] block mb-1">
                      Số điện thoại (dùng đăng nhập nhanh)
                    </label>
                    <input
                      type="text"
                      value={newTeamUserForm.phone ?? ''}
                      onChange={(e) => setNewTeamUserForm({ ...newTeamUserForm, phone: e.target.value })}
                      placeholder="VD: 0901xxxxxx"
                      className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-bold text-[var(--text-strong)] outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[var(--text-strong)] block mb-1">
                        Vai trò <span className="text-amber-400">*</span>
                      </label>
                      <select
                        value={newTeamUserForm.roleCode}
                        onChange={(e) =>
                          setNewTeamUserForm({ ...newTeamUserForm, roleCode: e.target.value as TeamUserRole })
                        }
                        className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-bold text-[var(--text-strong)] outline-none focus:border-amber-400 cursor-pointer"
                      >
                        <option value="PT">Huấn luyện viên (PT)</option>
                        <option value="OWNER">Chủ phòng (OWNER)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-[var(--text-strong)]">Mật khẩu</label>
                        <button
                          type="button"
                          onClick={() =>
                            setNewTeamUserForm({
                              ...newTeamUserForm,
                              password: generateTemporaryPassword(),
                            })
                          }
                          className="text-[10px] font-bold text-amber-400 hover:underline"
                        >
                          Ngẫu nhiên
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        minLength={8}
                        value={newTeamUserForm.password}
                        onChange={(e) => setNewTeamUserForm({ ...newTeamUserForm, password: e.target.value })}
                        placeholder="Nhập hoặc tạo mật khẩu tạm"
                        className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-bold text-[var(--text-strong)] outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--line)]">
                    <button
                      type="button"
                      onClick={() => setIsAddTeamUserOpen(false)}
                      className="h-10 rounded-xl border border-[var(--line)] px-4 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-strong)]"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={addTeamUserSubmitting}
                      className="h-10 rounded-xl bg-[var(--brand-yellow)] px-5 text-xs font-black text-black hover:brightness-95 disabled:opacity-50"
                    >
                      {addTeamUserSubmitting ? 'Đang tạo...' : 'Xác nhận cấp tài khoản'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Đặt Lại Mật Khẩu */}
          {resettingUser && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <KeyRound size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-[var(--text-strong)]">Đặt Lại Mật Khẩu Nhân Viên</h3>
                      <p className="text-xs text-[var(--text-muted)]">
                        {resettingUser.fullName} ({resettingUser.email})
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResettingUser(null)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-strong)] text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={(e) => void handleResetPassword(e)} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-[var(--text-strong)]">Mật khẩu mới</label>
                      <button
                        type="button"
                        onClick={() => setNewPasswordInput(generateTemporaryPassword())}
                        className="text-[11px] font-bold text-amber-400 hover:underline"
                      >
                        Tạo ngẫu nhiên
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      minLength={8}
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Nhập mật khẩu mới..."
                      className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-bold text-[var(--text-strong)] outline-none focus:border-amber-400"
                    />
                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                      Hệ thống tạo mật khẩu tạm ngẫu nhiên. Sau khi nhận, nhân viên có thể tự đổi lại mật khẩu.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
                    <button
                      type="button"
                      onClick={() => setResettingUser(null)}
                      className="h-10 rounded-xl border border-[var(--line)] px-4 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-strong)]"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={resetSubmitting || !newPasswordInput.trim()}
                      className="h-10 rounded-xl bg-[var(--brand-yellow)] px-5 text-xs font-black text-black hover:brightness-95 disabled:opacity-50"
                    >
                      {resetSubmitting ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: VIETQR CONFIGURATION ================= */}
      {activeTab === 'vietqr' && (
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-6 shadow-sm space-y-4">
          <div className="border-b border-[var(--line)] pb-4">
            <h2 className="text-lg font-black text-[var(--text-strong)]">Cài đặt tài khoản nhận tiền VietQR 24/7</h2>
            <p className="text-xs font-semibold text-[var(--text-muted)]">
              Hệ thống tự động đồng bộ tài khoản này ra website giới thiệu và tự sinh QR khi thu học phí hoặc thu nợ.
            </p>
          </div>

          {loadingQr ? (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-12 text-center text-xs sm:text-sm font-semibold text-[var(--text-muted)]">
              Đang tải cấu hình VietQR...
            </div>
          ) : (
            <form onSubmit={(event) => void handleQrSubmit(event)} className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-start">
              {/* Form Controls */}
              <div className="space-y-4">
                {qrError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs sm:text-sm font-bold text-red-400 shadow-sm animate-in fade-in">
                    {qrError}
                  </div>
                )}
                {qrSuccess && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs sm:text-sm font-bold text-emerald-400 shadow-sm animate-in fade-in flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>{qrSuccess}</span>
                  </div>
                )}

                {/* Bank Select */}
                <div>
                  <label className="text-xs sm:text-sm font-bold text-[var(--text-strong)] block mb-1.5">
                    Ngân hàng thụ hưởng <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={form.bankCode}
                    onChange={(event) => handleBankChange(event.target.value)}
                    className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs sm:text-sm font-bold text-[var(--text-strong)] outline-none focus:border-amber-400 transition-all cursor-pointer"
                    required
                  >
                    {bankOptions.map((bank) => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Account Number */}
                <div>
                  <label className="text-xs sm:text-sm font-bold text-[var(--text-strong)] block mb-1.5">
                    Số tài khoản ngân hàng <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.accountNumber}
                    onChange={(event) => setForm({ ...form, accountNumber: event.target.value.trim() })}
                    placeholder="VD: 58110001234567"
                    className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs sm:text-sm font-bold text-[var(--text-strong)] outline-none focus:border-amber-400 transition-all font-mono"
                    required
                  />
                </div>

                {/* Account Holder Name */}
                <div>
                  <label className="text-xs sm:text-sm font-bold text-[var(--text-strong)] block mb-1.5">
                    Tên chủ tài khoản (viết hoa không dấu) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.accountName}
                    onChange={(event) => setForm({ ...form, accountName: event.target.value.toUpperCase() })}
                    placeholder="VD: DOAN THE TIN"
                    className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs sm:text-sm font-bold text-[var(--text-strong)] outline-none focus:border-amber-400 transition-all uppercase"
                    required
                  />
                </div>

                {/* Transfer Prefix */}
                <div>
                  <label className="text-xs sm:text-sm font-bold text-[var(--text-strong)] block mb-1.5">
                    Tiền tố nội dung chuyển khoản
                  </label>
                  <input
                    type="text"
                    value={form.transferPrefix}
                    onChange={(event) => setForm({ ...form, transferPrefix: event.target.value.toUpperCase().trim() })}
                    placeholder="GYMDD"
                    className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs sm:text-sm font-bold text-[var(--text-strong)] outline-none focus:border-amber-400 transition-all uppercase"
                  />
                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                    Ví dụ: Với tiền tố GYMDD, nội dung chuyển khoản tự sinh sẽ là:{' '}
                    <span className="font-mono text-amber-400 font-bold">{previewContent}</span>
                  </p>
                </div>

                {/* Save Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingQr}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-yellow)] px-5 text-xs sm:text-sm font-black text-black shadow-md transition-all hover:brightness-95 disabled:opacity-50"
                  >
                    <Save size={16} />
                    <span>{savingQr ? 'Đang lưu cấu hình...' : 'Lưu cấu hình nhận tiền VietQR'}</span>
                  </button>
                </div>
              </div>

              {/* Live Preview Panel */}
              <aside className="rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)] p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                  <div className="flex items-center gap-2">
                    <QrCode size={18} className="text-amber-400" />
                    <span className="text-xs sm:text-sm font-black text-[var(--text-strong)]">Mẫu mã QR xem trước</span>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black text-emerald-400">
                    Trực tiếp
                  </span>
                </div>

                <div className="grid place-items-center rounded-xl bg-white p-4 shadow-inner">
                  {form.accountNumber ? (
                    <img
                      src={previewUrl}
                      alt="VietQR Demo Preview"
                      className="max-h-64 object-contain rounded-lg"
                      loading="lazy"
                    />
                  ) : (
                    <div className="py-12 text-center text-xs font-semibold text-slate-400">
                      Vui lòng nhập số tài khoản để hiển thị mã VietQR
                    </div>
                  )}
                </div>

                {/* Bank Details Live Card */}
                <div className="space-y-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-xs sm:text-sm shadow-sm">
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] pb-2">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">Ngân hàng:</span>
                    <span className="font-black text-[var(--text-strong)] text-right truncate">
                      {form.bankName || form.bankCode}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] pb-2">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">Số tài khoản:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-amber-400 text-sm">
                        {form.accountNumber || '-'}
                      </span>
                      {form.accountNumber && (
                        <button
                          type="button"
                          onClick={() => void copyToClipboard(form.accountNumber, 'acc')}
                          className="grid size-6 place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-white transition-colors"
                          title="Sao chép số tài khoản"
                        >
                          {copiedKey === 'acc' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] pb-2">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">Chủ tài khoản:</span>
                    <span className="font-black text-[var(--text-strong)] uppercase text-right truncate">
                      {form.accountName || '-'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] pb-2">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">Số tiền mẫu:</span>
                    <span className="font-black text-emerald-400 text-sm">
                      {formatMoney(300000)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">Nội dung mẫu:</span>
                    <span className="font-mono font-bold text-slate-300 dark:text-gray-300 text-xs text-right truncate">
                      {previewContent || '-'}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2 text-xs font-semibold text-[var(--text-muted)] leading-relaxed">
                  <Sparkles size={15} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Hệ thống tự động nhúng số tiền và mã hóa đơn vào QR. Học viên chỉ cần quét mã bằng app ngân hàng là chuyển khoản chuẩn xác.
                  </span>
                </div>
              </aside>
            </form>
          )}
        </section>
      )}
    </div>
  )
}
