import { apiGet, apiPut } from '../../../shared/api/apiClient'
import type { VietQrSetting, VietQrSettingPayload } from '../types/settings'

export function getVietQrSetting() {
  return apiGet<VietQrSetting>('/v1/public/vietqr-setting')
}

export function updateVietQrSetting(payload: VietQrSettingPayload) {
  return apiPut<VietQrSetting, VietQrSettingPayload>('/v1/settings/vietqr', payload)
}
