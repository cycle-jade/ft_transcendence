package org.example.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.example.dto.ProfileDto;
import org.example.dto.ProfileRequest;
import org.example.service.ProfileService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/profiles")
@RequiredArgsConstructor
public class ProfileController {
    private final ProfileService profileService;

    @PostMapping("/me")
    public ResponseEntity<ProfileDto> createProfile(
            @Valid @RequestBody ProfileRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = jwt.getClaim("userId");
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(profileService.createProfile(userId, request));
    }


    @GetMapping("/me")
    public ProfileDto getMyProfile( @AuthenticationPrincipal Jwt jwt) {
        Long userId = jwt.getClaim("userId");
        return profileService.getProfileByUser(userId);
    }

    @GetMapping("/{id}")
    public ProfileDto getProfile(@PathVariable @Min(1) Long id) {
        return profileService.getProfile(id);
    }

    @GetMapping("/user/{userId}")
    public ProfileDto getProfileByUser(@PathVariable @Min(1) Long userId) {
        return profileService.getProfileByUser(userId);
    }

    @PutMapping("/{id}")
    public ProfileDto updateProfile(
            @PathVariable @Min(1) Long id,
            @Valid @RequestBody ProfileRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = jwt.getClaim("userId");
        return profileService.updateProfile(id, request, userId);
    }

    @PutMapping("/me")
    public ProfileDto updateMyProfile(
            @Valid @RequestBody ProfileRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = jwt.getClaim("userId");
        return profileService.updateProfileByUser(userId, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProfile(
            @PathVariable @Min(1) Long id,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = jwt.getClaim("userId");
        profileService.deleteProfile(id, userId);
        return ResponseEntity.noContent().build();
    }
}
