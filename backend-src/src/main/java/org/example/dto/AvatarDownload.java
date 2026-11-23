package org.example.dto;

import org.springframework.core.io.Resource;

public record AvatarDownload(
        Resource resource,
        String originalFileName,
        String contentType,
        Long size
) {
}