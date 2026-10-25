package com.gymduongdouble.backend.member.web.dto;

/**
 * Bộ lọc danh sách hội viên trên giao diện người dùng (UI Query Filter):
 * 
 * - ALL: Toàn bộ danh sách hội viên mà người dùng có quyền xem (kể cả chưa mua gói).
 * - ACTIVE: Hội viên có MemberStatus.ACTIVE VÀ có gói tập đang hiệu lực hôm nay (startDate <= today <= endDate).
 * - EXPIRING_SOON: Hội viên có gói sắp hết hạn trong 7 ngày tới (trạng thái tính toán động, không lưu cứng vào DB).
 * - EXPIRED: Hội viên có gói tập đã hết hạn (endDate < today).
 */
public enum MemberListFilter {
    ALL,
    ACTIVE,
    EXPIRING_SOON,
    EXPIRED
}
