import { apiDelete, apiGet, apiPost, apiPut } from '../../../shared/api/apiClient'
import type { PageResponse } from '../../../shared/types/pagination'
import type {
  MemberDetail,
  MemberListFilter,
  MemberListStatistics,
  MemberMembership,
  MemberMembershipPayload,
  MemberPayload,
  MemberSummary,
} from '../types/member'

type ListMembersParams = {
  keyword?: string
  filter?: MemberListFilter
}

type ListMembersPageParams = ListMembersParams & {
  page?: number
  size?: number
}

export function listMembers({ keyword, filter = 'ALL' }: ListMembersParams = {}) {
  return apiGet<MemberSummary[]>('/v1/members', {
    params: {
      keyword: keyword || undefined,
      filter,
    },
  })
}

export function listMembersPage({ keyword, filter = 'ALL', page = 0, size = 10 }: ListMembersPageParams = {}) {
  return apiGet<PageResponse<MemberSummary>>('/v1/members/page', {
    params: {
      keyword: keyword || undefined,
      filter,
      page,
      size,
    },
  })
}

export function getMemberListStatistics() {
  return apiGet<MemberListStatistics>('/v1/members/statistics')
}

export function getMemberDetail(id: number) {
  return apiGet<MemberDetail>(`/v1/members/${id}`)
}

export function createMember(payload: MemberPayload) {
  return apiPost<MemberDetail['profile'], MemberPayload>('/v1/members', payload)
}

export function updateMember(id: number, payload: MemberPayload) {
  return apiPut<MemberDetail['profile'], MemberPayload>(`/v1/members/${id}`, payload)
}

export function createMemberMembership(memberId: number, payload: MemberMembershipPayload) {
  return apiPost<MemberMembership, MemberMembershipPayload>(`/v1/members/${memberId}/memberships`, payload)
}

export function createPortalAccount(memberId: number, password?: string) {
  return apiPost<MemberDetail>(`/v1/members/${memberId}/portal-account`, { password })
}

export function updatePortalAccountStatus(memberId: number, status: 'ACTIVE' | 'LOCKED') {
  return apiPut<MemberDetail>(`/v1/members/${memberId}/portal-account/status`, { status })
}

export function resetPortalAccountPassword(memberId: number, newPassword?: string) {
  return apiPost<MemberDetail>(`/v1/members/${memberId}/portal-account/reset-password`, { newPassword })
}

export function deletePortalAccount(memberId: number) {
  return apiDelete<MemberDetail>(`/v1/members/${memberId}/portal-account`)
}
