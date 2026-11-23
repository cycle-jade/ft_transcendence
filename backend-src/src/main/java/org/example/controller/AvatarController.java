package org.example.controller;

import lombok.RequiredArgsConstructor;
import org.example.dto.AvatarDto;
import org.example.service.AvatarService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/avatar")
@RequiredArgsConstructor
public class AvatarController {

    private final AvatarService avatarService;

    @PostMapping(value = "/{profileId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AvatarDto> uploadAttachment(
            @PathVariable Long profileId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = jwt.getClaim("userId");
        AvatarDto avatar = avatarService.uploadAvatar(profileId, userId, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(avatar);
    }

    @GetMapping("/{avatarId}/download")
    public ResponseEntity<Resource> getAvatar(@PathVariable Long avatarId) {
        var avatar = avatarService.getAvatar(avatarId);
        MediaType mediaType = avatar.contentType() == null
                ? MediaType.APPLICATION_OCTET_STREAM
                : MediaType.parseMediaType(avatar.contentType());

        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(avatar.size() == null ? -1 : avatar.size())
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + avatar.originalFileName() + "\"")
                .body(avatar.resource());
    }


    @DeleteMapping("/{profileId}/{avatarId}")
    public ResponseEntity<Void> deleteAttachment(
            @PathVariable Long profileId,
            @PathVariable Long avatarId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = jwt.getClaim("userId");
       avatarService.deleteAvatar(profileId, avatarId, userId);
        return ResponseEntity.noContent().build();
    }
}
