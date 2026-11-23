package org.example.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.example.dto.ChangePasswordRequest;
import org.example.dto.UserDto;
import org.example.dto.UserListDto;
import org.example.dto.UserStatusDto;
import org.example.entity.UserRoles;
import org.example.service.SkillService;
import org.example.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final SkillService skillService;

    @GetMapping("/{id}")
    public UserDto getUser(@PathVariable("id") @Min(1) Long id) {
        return userService.getUser(id);
    }

    @GetMapping("/me")
    public UserDto getMe(@AuthenticationPrincipal Jwt jwt) {
        Long userId = jwt.getClaim("userId");
        return userService.getUser(userId);
    }

    @GetMapping("/all")
    public ResponseEntity<List<UserListDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/allByName/{name}")
    public ResponseEntity<List<UserListDto>> getAllUsersByName(@PathVariable String name) {
        return ResponseEntity.ok(userService.getAllUsersByName(name));
    }

    @GetMapping("/allByLastname/{lastname}")
    public ResponseEntity<List<UserListDto>> getAllUsersByLastname(@PathVariable String lastname) {
        return ResponseEntity.ok(userService.getAllUsersByLastname(lastname));
    }

    @GetMapping("/nickname/{nickname}")
    public ResponseEntity<UserDto> getAllUsersByNickname(@PathVariable String nickname) {
        return ResponseEntity.ok(userService.getUserByNickname(nickname));
    }

    @GetMapping("/me/status")
    public UserStatusDto getMyStatus(@AuthenticationPrincipal Jwt jwt) {
        Long userId = jwt.getClaim("userId");
        return userService.getUserStatus(userId);
    }

    @GetMapping("/{id}/status")
    public UserStatusDto getUserStatus(@PathVariable("id") @Min(1) Long id) {
        return userService.getUserStatus(id);
    }

    @GetMapping("/search/skill/{skillId}")
    public ResponseEntity<List<UserListDto>> searchBySkill(@PathVariable Long skillId) {
        return ResponseEntity.ok(skillService.searchUsersBySkill(skillId));
    }

    @PostMapping("/online")
    public ResponseEntity<Void> markOnline(
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = jwt.getClaim("userId");
        userService.writeLastSeenAt(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/offline")
    public ResponseEntity<Void> markOffline(
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = jwt.getClaim("userId");
        userService.markOffline(userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/update/{id}")
    public UserDto updateMyProfile(
            @PathVariable("id") @Min(1) Long id,
            @Valid @RequestBody UserDto request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = jwt.getClaim("userId");
        return userService.updateUser(id, userId, request);
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody ChangePasswordRequest request
    ) {
        Long userId = jwt.getClaim("userId");
        userService.changePassword(userId, request);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/block/{id}")
    public UserDto blockUserProfile(
            @PathVariable("id") @Min(1) Long idUser,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long adminId = jwt.getClaim("userId");
        return userService.blockUser(idUser, adminId);
    }

    @PutMapping("/unblock/{id}")
    public UserDto unBlockUserProfile(
            @PathVariable("id") @Min(1) Long idUser,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long adminId = jwt.getClaim("userId");
        return userService.unBlockUser(idUser, adminId);
    }

    @PutMapping("/changeRole/{id}/{role}")
    public UserDto promoteUser(
            @PathVariable("id") @Min(1) Long idUser,
            @PathVariable("role") @NotNull UserRoles role,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long adminId = jwt.getClaim("userId");
        return userService.changRoleUser(idUser, adminId, role);
    }
}


