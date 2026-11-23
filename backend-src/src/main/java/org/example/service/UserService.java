package org.example.service;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.example.dto.ChangePasswordRequest;
import org.example.dto.UserDto;
import org.example.dto.UserListDto;
import org.example.dto.UserStatusDto;
import org.example.entity.User;
import org.example.entity.UserRoles;
import org.example.entity.UserStatus;
import org.example.exception.ForbiddenActionException;
import org.example.exception.ResourceNotFoundException;
import org.example.mapper.UserMapper;
import org.example.repo.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserService {


    private final UserRepository userRepository;

    private final UserMapper userMapper;

    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, UserMapper userMapper, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }


    @Transactional(readOnly = true)
    public UserDto getUser(Long id) {
        return (userMapper.toDto(userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"))));
    }

    public List<UserListDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserMapper::toListDto)
                .toList();
    }

    public UserStatusDto getUserStatus(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return new UserStatusDto(
                user.getId(),
                user.getOnlineStatus(),
                user.isBannedStatus()
        );
    }

    @Transactional
    public void writeLastSeenAt(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setLastSeenAt(LocalDateTime.now());
        user.setOnlineStatus(UserStatus.ONLINE);
        userRepository.save(user);
    }

    @Transactional
    public void markOffline(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setOnlineStatus(UserStatus.OFFLINE);
        userRepository.save(user);
    }

    @Scheduled(fixedRate = 120000) //every two minutes
    @Transactional
    public void makeUserOnline() {
        userRepository.findAll().forEach(user -> {
            LocalDateTime offlineThreshold = LocalDateTime.now().minusMinutes(5);

            if (user.getLastSeenAt() == null || user.getLastSeenAt().isBefore(offlineThreshold)) {
                user.setOnlineStatus(UserStatus.OFFLINE);
            }
        });
    }

    @Transactional
    public UserDto updateUser(Long targetUserId, Long requesterId, @Valid UserDto request) {
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!targetUserId.equals(requesterId) && requester.getRole() != UserRoles.ADMIN) {
            throw new ForbiddenActionException("You are not allowed to update this user");
        }

        user.setPhone(request.phone());
        user.setEmail(request.email());
        user.setAbout(request.about());
        user.setName(request.name());
        user.setLastName(request.lastName());
        userRepository.save(user);
        return (userMapper.toDto(user));
    }


    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.oldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Old password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    public UserDto blockUser(@Min(1) Long idUser, Long adminId) {
        User admin = userRepository.findById(adminId).orElseThrow(() -> new ResourceNotFoundException("Admin not found"));
        if (admin.getRole() != UserRoles.ADMIN) {
            throw new ForbiddenActionException("You are not Admin for block User");
        }
        User user = userRepository.findById(idUser).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setBannedStatus(true);
        userRepository.save(user);
        return userMapper.toDto(user);
    }

    @Transactional
    public UserDto unBlockUser(@Min(1) Long idUser, Long adminId) {
        User admin = userRepository.findById(adminId).orElseThrow(() -> new ResourceNotFoundException("Admin not found"));
        if (admin.getRole() != UserRoles.ADMIN) {
            throw new ForbiddenActionException("You are not Admin for unblock User");
        }
        User user = userRepository.findById(idUser).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setBannedStatus(false);
        userRepository.save(user);
        return userMapper.toDto(user);
    }

    public List<UserListDto> getAllUsersByName(String name) {
        return userRepository.findAll().stream()
                .filter(user -> user.getName() != null && user.getName().equalsIgnoreCase(name))
                .map(UserMapper::toListDto)
                .toList();
    }

    public List<UserListDto> getAllUsersByLastname(String lastname) {
        return userRepository.findAll().stream()
                .filter(user -> user.getLastName() != null && user.getLastName().equalsIgnoreCase(lastname))
                .map(UserMapper::toListDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserDto getUserByNickname(String nickname) {
        return (userMapper.toDto(userRepository.findByNickname(nickname).orElseThrow(() -> new ResourceNotFoundException("User not found"))));
    }

    @Transactional
    public UserDto changRoleUser(Long idUser, Long adminId, UserRoles role) {
        User admin = userRepository.findById(adminId).orElseThrow(() -> new ResourceNotFoundException("Admin not found"));
        if (admin.getRole() != UserRoles.ADMIN) {
            throw new ForbiddenActionException("You are not Admin for change role");
        }
        User user = userRepository.findById(idUser).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setRole(role);
        userRepository.save(user);
        return userMapper.toDto(user);
    }
}
