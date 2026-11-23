package org.example.service;

import lombok.RequiredArgsConstructor;
import org.example.entity.User;
import org.example.repo.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String login)
            throws UsernameNotFoundException {

        User user = userRepository.findByEmail(login)
                .or(() -> userRepository.findByNickname(login))
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found: " + login
                        )
                );

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail() == null ? user.getNickname() : user.getEmail())
                .password(user.getPassword())
                .roles(user.getRole().name())
                .accountLocked(user.isBannedStatus())
                .build();
    }
}
