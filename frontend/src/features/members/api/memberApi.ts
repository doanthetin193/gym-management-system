import { apiGet, apiPost, apiPut } from '../../../shared/api/apiClient'
import type { MemberDetail, MemberListFilter, MemberPayload, MemberSummary } from '../types/member'

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
