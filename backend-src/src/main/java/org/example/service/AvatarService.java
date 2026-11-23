package org.example.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.example.dto.AvatarDownload;
import org.example.dto.AvatarDto;
import org.example.entity.Avatar;
import org.example.entity.Profile;
import org.example.repo.AvatarRepository;
import org.example.repo.ProfileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AvatarService {

    @Value("${app.uploads.avatars-dir}")
    private String avatarsDir;

    private final AvatarRepository avatarRepository;

    private final ProfileRepository profileRepository;

    public AvatarDownload getAvatar( Long avatarId) {
        Avatar avatar = avatarRepository.findById(avatarId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Avatar not found"));

        Path avatarDirectory = getAvatarDirectory(avatar.getProfile().getId());
        Path filePath = avatarDirectory.resolve(avatar.getStoredFileName()).normalize();
        if (!filePath.startsWith(avatarDirectory.normalize()) || !Files.exists(filePath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        }

        return new AvatarDownload(
                new FileSystemResource(filePath),
                avatar.getOriginalFileName(),
                avatar.getContentType(),
                avatar.getSize()
        );
    }

    @Transactional
    public void deleteAvatar(Long profileId, Long avatarId, Long userId) {
        getProfileForOwner(profileId, userId);
        Avatar avatar = avatarRepository.findById(avatarId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Avatar not found"));
        if (!avatar.getProfile().getId().equals(profileId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Avatar not found for profile");
        }

        Path filePath = getAvatarDirectory(profileId).resolve(avatar.getStoredFileName()).normalize();
        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not delete file", e);
        }

        avatarRepository.delete(avatar);
    }

    private Profile getProfileForOwner(Long profileId, Long userId) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));

        if (!profile.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot change data for someone else's profile");
        }
        return profile;
    }

    private Path getAvatarDirectory(Long profileId) {
        return Path.of(avatarsDir).resolve(String.valueOf(profileId)).normalize();
    }

    @Transactional
    public AvatarDto uploadAvatar(Long profileId, Long userId, MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }

        Profile profile = getProfileForOwner(profileId, userId);
        String originalFileName = cleanFileName(file.getOriginalFilename());
        String storedFileName = UUID.randomUUID() + "_" + originalFileName;
        Path avatarDirectory = getAvatarDirectory(profileId);
        Path target = avatarDirectory.resolve(storedFileName).normalize();

        try {
            Files.createDirectories(avatarDirectory);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save file", e);
        }

        Avatar avatar = avatarRepository.findByProfileId(profileId).orElseGet(Avatar::new);
        if (avatar.getStoredFileName() != null) {
            try {
                Files.deleteIfExists(avatarDirectory.resolve(avatar.getStoredFileName()).normalize());
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not replace avatar", e);
            }
        }

        avatar.setStoredFileName(storedFileName);
        avatar.setOriginalFileName(originalFileName);
        avatar.setProfile(profile);
        avatar.setContentType(file.getContentType());
        avatar.setSize(file.getSize());
        avatar.setCreatedAt(LocalDateTime.now());


        avatar = avatarRepository.save(avatar);
        avatar.setUrl("/api/v1/avatar/" + avatar.getId() + "/download");
        profile.setAvatarUrl(avatar.getUrl());
        return toDto(avatarRepository.save(avatar));
    }

    private String cleanFileName(String fileName) {
        String cleaned = StringUtils.cleanPath(fileName == null ? "file" : fileName);
        if (cleaned.contains("..")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file name");
        }

        return cleaned.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private AvatarDto toDto(Avatar avatar) {
        return new AvatarDto(
                avatar.getId(),
                avatar.getProfile().getId(),
                avatar.getOriginalFileName(),
                avatar.getContentType(),
                avatar.getSize(),
                avatar.getUrl(),
                avatar.getCreatedAt()
        );
    }
}
