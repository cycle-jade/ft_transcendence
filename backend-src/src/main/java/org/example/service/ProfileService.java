package org.example.service;

import lombok.RequiredArgsConstructor;
import org.example.dto.ProfileDto;
import org.example.dto.ProfileRequest;
import org.example.entity.*;
import org.example.exception.ConflictException;
import org.example.exception.ForbiddenActionException;
import org.example.exception.ResourceNotFoundException;
import org.example.exception.UserNotFoundException;
import org.example.mapper.ProfileMapper;
import org.example.repo.ProfileRepository;
import org.example.repo.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ProfileService {
    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final ProfileMapper profileMapper;

    public ProfileDto createProfile(Long userId, ProfileRequest request) {
        if (profileRepository.existsByUserId(userId)) {
            throw new ConflictException("Profile already exists for user " + userId);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        Profile profile = new Profile();
        profile.setUser(user);
        applyRequest(profile, request);
        profile.setCreatedAt(LocalDateTime.now());
        profile.setUpdatedAt(LocalDateTime.now());

        return profileMapper.toDto(profileRepository.save(profile));
    }

    public ProfileDto getProfile(Long id) {
        return profileMapper.toDto(findProfile(id));
    }

    public ProfileDto getProfileByUser(Long userId) {
        return profileMapper.toDto(profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for user " + userId)));
    }

    public ProfileDto updateProfile(Long id, ProfileRequest request, Long requesterId) {
        Profile profile = findProfile(id);
        if (!Objects.equals(profile.getUser().getId(), requesterId)) {
            throw new ForbiddenActionException("You are not allowed to update this profile");
        }
        applyRequest(profile, request);
        profile.setUpdatedAt(LocalDateTime.now());
        return profileMapper.toDto(profileRepository.save(profile));
    }

    public ProfileDto updateProfileByUser(Long userId, ProfileRequest request) {
        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for user " + userId));
        applyRequest(profile, request);
        profile.setUpdatedAt(LocalDateTime.now());
        return profileMapper.toDto(profileRepository.save(profile));
    }

    public void deleteProfile(Long id, Long requesterId) {
        Profile profile = findProfile(id);
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!Objects.equals(profile.getUser().getId(), requesterId) && !requester.getRole().equals(UserRoles.ADMIN)) {
            throw new ForbiddenActionException("You are not allowed to delete this profile");
        }

        profileRepository.delete(profile);
    }

    private Profile findProfile(Long id) {
        return profileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found " + id));
    }

    private void applyRequest(Profile profile, ProfileRequest request) {
        profile.setDisplayName(request.displayName());
        profile.setBio(request.bio());
        // avatarUrl is managed separately via the avatar upload endpoint —
        // don't let a profile edit wipe it out just because the edit form
        // doesn't round-trip the current value.
        if (request.avatarUrl() != null) {
            profile.setAvatarUrl(request.avatarUrl());
        }
        profile.setLocation(request.location());
        profile.setWebsiteUrl(request.websiteUrl());
    }
}
