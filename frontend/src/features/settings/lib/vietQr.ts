import type { VietQrSetting } from '../types/settings'

type BuildVietQrUrlParams = {
  setting: VietQrSetting
  amount?: number | null
  addInfo?: string | null
}

export function normalizeTransferContent(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9\s._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .slice(0, 90)
}

export function buildTransferContent(setting: VietQrSetting, memberName?: string | null, debtId?: number | null) {
  const prefix = setting.transferPrefix || 'GYMDD'
  const parts = [prefix, memberName, debtId ? `NO ${debtId}` : null].filter(Boolean)
  return normalizeTransferContent(parts.join(' '))
}

export function buildVietQrImageUrl({ setting, amount, addInfo }: BuildVietQrUrlParams) {
  if (!setting.enabled || !setting.bankCode || !setting.accountNumber || !setting.accountName) {
    return ''
  }

  const params = new URLSearchParams()
  const roundedAmount = Math.max(Math.round(amount ?? 0), 0)

  if (roundedAmount > 0) {
    params.set('amount', roundedAmount.toString())
  }
  if (addInfo) {
    params.set('addInfo', addInfo)
  }
  params.set('accountName', setting.accountName)

  const template = setting.template || 'compact2'
  return `https://img.vietqr.io/image/${setting.bankCode}-${setting.accountNumber}-${template}.png?${params.toString()}`
}
