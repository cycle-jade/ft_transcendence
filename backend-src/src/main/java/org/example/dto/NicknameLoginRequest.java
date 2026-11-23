package org.example.dto;

public record NicknameLoginRequest(
        String nickname,
        String password
) {
}
