package org.example.dto;

import org.springframework.core.io.Resource;

public record PostAttachmentDownload(
            Resource resource,
            String originalFileName,
            String contentType,
            Long size
    ) {
    }