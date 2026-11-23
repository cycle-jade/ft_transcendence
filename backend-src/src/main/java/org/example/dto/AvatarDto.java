package org.example.dto;

import java.time.LocalDateTime;

public record AvatarDto(
        Long id,
        Long profileId,
        String originalFileName,
        String contentType,
        Long size,
        String url,
        LocalDateTime createdAt
) {
}