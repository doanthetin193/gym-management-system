import { apiGet } from '../../../shared/api/apiClient'
import type { MemberPortal } from '../types/memberPortal'

export function getMyMemberPortal() {
  return apiGet<MemberPortal>('/v1/member-portal/me')
}
