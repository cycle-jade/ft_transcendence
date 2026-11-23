package org.example.dto;

import java.time.LocalDateTime;

public record PostAttachmentDto(
        Long id,
        Long postId,
        String originalFileName,
        String contentType,
        Long size,
        String url,
        LocalDateTime createdAt
) {
}
