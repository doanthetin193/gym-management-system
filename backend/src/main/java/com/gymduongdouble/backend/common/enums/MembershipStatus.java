package com.gymduongdouble.backend.common.enums;

/**
 * Trạng thái vòng đời của Lượt đăng ký gói tập (MemberMembership - lưu cứng vào Database):
 * 
 * [LƯU Ý THIẾT KẾ KIẾN TRÚC]:
 * 1. Tại sao KHÔNG có trạng thái EXPIRING_SOON (Sắp hết hạn) ở đây?
 *    - "Sắp hết hạn" là trạng thái tính toán động theo thời gian thực (Computed State) dựa trên
 *      AppClock.today() và ngày kết thúc endDate (<= 7 ngày).
 *    - Hội viên trong 7 ngày đó vẫn mang quyền lợi hợp pháp ACTIVE để vào phòng tập bình thường.
 *    - Việc không lưu EXPIRING_SOON vào DB giúp tránh phải chạy batch job quét update DB mỗi đêm lúc 0h00,
 *      tránh rủi ro race condition và lãng phí I/O.
 *    - EXPIRING_SOON chỉ nằm trong enum bộ lọc MemberListFilter ở tầng giao diện người dùng (UI).
 * 
 * 2. Vai trò của PENDING_PAYMENT:
 *    - Là trạng thái dự phòng kiến trúc cho tính năng hội viên tự mua gói online qua cổng thanh toán
 *      (VNPay/MoMo) trong tương lai.
 *    - Hiện tại tại quầy phòng tập: khách nợ tiền vẫn được cấp ACTIVE để vào tập ngay, phần tiền thiếu
 *      được tách riêng và quản lý độc lập qua DebtRecord.
 */
public enum MembershipStatus {
    ACTIVE,
    EXPIRED,
    CANCELLED,
    PENDING_PAYMENT
}
