package org.example.service;

import lombok.RequiredArgsConstructor;
import org.example.dto.UserListDto;
import org.example.entity.User;
import org.example.exception.ResourceNotFoundException;
import org.example.mapper.UserMapper;
import org.example.repo.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final UserRepository userRepository;

    @Transactional
    public void follow(Long userId, Long targetId) {

        if (userId.equals(targetId)) {
            throw new IllegalArgumentException("You cannot follow yourself");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("Target user not found"));

        if (user.getFollowing().contains(target)) return;
        user.getFollowing().add(target);
        target.getFollowers().add(user);
        userRepository.save(user);
        userRepository.save(target);
    }

    @Transactional
    public void unfollow(Long userId, Long targetId) {

        if (userId.equals(targetId)) {
            throw new IllegalArgumentException("You cannot unfollow yourself");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("Target user not found"));

        user.getFollowing().remove(target);
        target.getFollowers().remove(user);
        userRepository.save(user);
        userRepository.save(target);
    }

    @Transactional(readOnly = true)
    public Integer getFollowerCount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return user.getFollowers() == null ? 0 : user.getFollowers().size();
    }

    @Transactional(readOnly = true)
    public List<UserListDto> getFollowers(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getFollowers() == null) {
            return Collections.emptyList();
        }
        return user.getFollowers().stream()
                .map(UserMapper::toListDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public Integer getFollowingCount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return user.getFollowing() == null ? 0 : user.getFollowing().size();
    }

    @Transactional(readOnly = true)
    public List<UserListDto> getFollowing(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getFollowing() == null) {
            return Collections.emptyList();
        }
        return user.getFollowing().stream()
                .map(UserMapper::toListDto)
                .toList();
    }
}
