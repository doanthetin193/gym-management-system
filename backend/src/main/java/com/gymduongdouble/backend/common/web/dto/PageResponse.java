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
     * Creates a bounded page from an already authorized and filtered in-memory list.
     * This is useful where business access rules must run before a page is exposed.
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
