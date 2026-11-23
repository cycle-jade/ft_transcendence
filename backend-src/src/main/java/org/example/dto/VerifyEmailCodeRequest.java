package org.example.dto;

public record VerifyEmailCodeRequest(
        String verificationId,
        String code
) {
}
