package com.gymduongdouble.backend.common.time;

import java.time.LocalDate;
import java.time.ZoneId;

public final class AppClock {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private AppClock() {
    }

    public static LocalDate today() {
        return LocalDate.now(VIETNAM_ZONE);
    }

    public static ZoneId zone() {
        return VIETNAM_ZONE;
    }
}
