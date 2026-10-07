import { apiDelete, apiGet, apiPost, apiPut } from '../../../shared/api/apiClient'
import type {
  MemberDetail,
  MemberListFilter,
  MemberMembership,
  MemberMembershipPayload,
  MemberPayload,
  MemberSummary,
} from '../types/member'

type ListMembersParams = {
  keyword?: string
  filter?: MemberListFilter
}

export function listMembers({ keyword, filter = 'ALL' }: ListMembersParams = {}) {
  return apiGet<MemberSummary[]>('/v1/members', {
    params: {
      keyword: keyword || undefined,
      filter,
    },
  })
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
