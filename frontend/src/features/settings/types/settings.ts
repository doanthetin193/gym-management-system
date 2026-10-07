export type VietQrSetting = {
  enabled: boolean
  bankCode: string
  bankName: string
  accountNumber: string
  accountName: string
  transferPrefix: string
  template: string
}

export type VietQrSettingPayload = VietQrSetting
