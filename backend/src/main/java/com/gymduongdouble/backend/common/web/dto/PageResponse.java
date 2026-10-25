package com.gymduongdouble.backend.common.web.dto;

import java.util.List;
import org.springframework.data.domain.Page;

public record PageResponse<T>(
    List<T> items,
    int page,
    int size,
    long totalItems,
    int totalPages,
    boolean first,
    boolean last
) {

    /**
     * [CHIẾN LƯỢC 1: PHÂN TRANG TẠI DATABASE (SQL LIMIT/OFFSET)]
     * Chuyển đổi từ Page<T> của Spring Data JPA sang DTO PageResponse chuẩn hoá.
     * Lược bỏ các trường rườm rà của framework (pageable, sort...), chỉ giữ lại 7 trường cốt lõi.
     */
    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages(),
            page.isFirst(),
            page.isLast()
        );
    }

    /**
     * [CHIẾN LƯỢC 2: PHÂN TRANG TRÊN BỘ NHỚ RAM (IN-MEMORY BOUNDED PAGINATION)]
     * Dùng khi dữ liệu cần chạy qua logic phân quyền bảo mật (vd: PT canAccessMember)
     * hoặc tính toán trạng thái động theo ngày (AppClock.today()) trước khi cắt trang.
     * 
     * - Math.min(requestedSize, 50): Chống tấn công DDOS/OOM làm tràn bộ nhớ server.
     * - Math.min(..., totalPages - 1): Chuẩn hóa số trang, tránh văng IndexOutOfBoundsException khi page vượt ngưỡng.
     * - items.subList(fromIndex, toIndex): Cắt đúng khoảng phần tử cần trả về cho Client.
     */
    public static <T> PageResponse<T> fromItems(List<T> items, int requestedPage, int requestedSize, int defaultSize) {
        int size = requestedSize <= 0 ? defaultSize : Math.min(requestedSize, 50);
        long totalItems = items.size();
        int totalPages = totalItems == 0 ? 0 : (int) Math.ceil((double) totalItems / size);
        int page = totalPages == 0 ? 0 : Math.min(Math.max(requestedPage, 0), totalPages - 1);
        long offset = (long) page * size;
        int fromIndex = (int) Math.min(offset, totalItems);
        int toIndex = (int) Math.min(offset + size, totalItems);

        return new PageResponse<>(
            items.subList(fromIndex, toIndex),
            page,
            size,
            totalItems,
            totalPages,
            page == 0,
            totalPages == 0 || page >= totalPages - 1
        );
    }
}
