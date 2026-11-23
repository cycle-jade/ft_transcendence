package org.example.controller;

import lombok.RequiredArgsConstructor;
import org.example.dto.UserListDto;
import org.example.service.FollowService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/social")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    @PostMapping("/follow/{targetId}")
    public ResponseEntity<Void> follow(@PathVariable Long targetId, @AuthenticationPrincipal Jwt jwt) {
        Long userId = jwt.getClaim("userId");
        followService.follow(userId, targetId);

        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/unfollow/{targetId}")
    public ResponseEntity<Void> unfollow(@PathVariable Long targetId, @AuthenticationPrincipal Jwt jwt) {
        Long userId = jwt.getClaim("userId");
        followService.unfollow(userId, targetId);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("follower/count")
    public ResponseEntity<Integer> getFollowerCount(@AuthenticationPrincipal Jwt jwt) {
        Long userId = jwt.getClaim("userId");
        return ResponseEntity.ok(followService.getFollowerCount(userId));
    }

    @GetMapping("follower/all")
    public ResponseEntity<List<UserListDto>> getFollowers(@AuthenticationPrincipal Jwt jwt) {
        Long userId = jwt.getClaim("userId");
        return ResponseEntity.ok(followService.getFollowers(userId));
    }

    @GetMapping("following/count")
    public ResponseEntity<Integer> getFollowingCount(@AuthenticationPrincipal Jwt jwt) {
        Long userId = jwt.getClaim("userId");
        return ResponseEntity.ok(followService.getFollowingCount(userId));
    }

    @GetMapping("following/all")
    public ResponseEntity<List<UserListDto>> getFollowing(@AuthenticationPrincipal Jwt jwt) {
        Long userId = jwt.getClaim("userId");
        return ResponseEntity.ok(followService.getFollowing(userId));
    }
}
