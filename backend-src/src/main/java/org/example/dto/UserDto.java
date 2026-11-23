package org.example.dto;

import lombok.Builder;
import org.example.entity.UserRoles;
import org.example.entity.UserStatus;

import java.util.List;

@Builder
public record UserDto(
        Long id,
        String nickname,
        String name,
        String lastName,
        String email,
        String phone,
        UserRoles role,
        List<Long> postIds,
        List<Long> channelIds,
        String about,
        String avatarUrl,
        UserStatus onlineStatus
) {
}