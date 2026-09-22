package com.gymduongdouble.backend.common.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

final class MessageDigestSupport {

    private MessageDigestSupport() {
    }

    static boolean constantTimeEquals(String first, String second) {
        return MessageDigest.isEqual(
            first.getBytes(StandardCharsets.UTF_8),
            second.getBytes(StandardCharsets.UTF_8)
        );
    }
}
