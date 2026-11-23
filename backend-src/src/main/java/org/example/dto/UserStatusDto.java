package org.example.dto;

import org.example.entity.UserStatus;

public record UserStatusDto(
        Long userId,
        UserStatus onlineStatus,
        boolean blocked
) {
}
