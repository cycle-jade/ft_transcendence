package org.example.dto;

public record TwoFactorChallengeResponse(
        boolean requiresTwoFactor,
        String verificationId,
        int expiresInSeconds
) {
}
