package org.example.controller;

import lombok.RequiredArgsConstructor;
import org.example.dto.PostAttachmentDownload;
import org.example.dto.PostAttachmentDto;
import org.example.service.PostAttachmentService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/posts/{postId}/attachments")
@RequiredArgsConstructor
public class PostAttachmentController {

    private final PostAttachmentService postAttachmentService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostAttachmentDto> uploadAttachment(
            @PathVariable Long postId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = jwt.getClaim("userId");
        PostAttachmentDto attachment = postAttachmentService.uploadAttachment(postId, userId, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(attachment);
    }

    @GetMapping
    public ResponseEntity<List<PostAttachmentDto>> getAttachments(@PathVariable Long postId) {
        return ResponseEntity.ok(postAttachmentService.getAttachments(postId));
    }

    @GetMapping("/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Long postId,
            @PathVariable Long attachmentId
    ) {
        PostAttachmentDownload download =
                postAttachmentService.downloadAttachment(postId, attachmentId);

        MediaType mediaType = download.contentType() == null
                ? MediaType.APPLICATION_OCTET_STREAM
                : MediaType.parseMediaType(download.contentType());

        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(download.size() == null ? -1 : download.size())
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + download.originalFileName() + "\"")
                .body(download.resource());
    }

    @DeleteMapping("/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(
            @PathVariable Long postId,
            @PathVariable Long attachmentId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = jwt.getClaim("userId");
        postAttachmentService.deleteAttachment(postId, attachmentId, userId);
        return ResponseEntity.noContent().build();
    }
}
