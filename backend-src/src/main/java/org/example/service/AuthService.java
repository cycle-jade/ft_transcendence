package org.example.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.example.dto.AuthResponse;
import org.example.dto.LoginRequest;
import org.example.dto.NicknameLoginRequest;
import org.example.dto.RegisterRequest;
import org.example.dto.TwoFactorChallengeResponse;
import org.example.dto.VerifyEmailCodeRequest;
import org.example.entity.EmailVerificationCode;
import org.example.entity.User;
import org.example.entity.UserRoles;
import org.example.entity.UserStatus;
import org.example.exception.ConflictException;
import org.example.exception.ForbiddenActionException;
import org.example.exception.ResourceNotFoundException;
import org.example.repo.EmailVerificationCodeRepository;
import org.example.repo.UserRepository;
import org.example.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int TWO_FACTOR_EXPIRES_IN_SECONDS = 600;

    private final UserRepository userRepository;
    private final EmailVerificationCodeRepository emailVerificationCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${security.two-factor.email-enabled:false}")
    private boolean twoFactorEmailEnabled;

    @Value("${security.two-factor.test-code:000000}")
    private String twoFactorTestCode;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByNickname(request.nickname())) {
            throw new ConflictException(
                    "Nickname is already used"
            );
        }

        if (request.email() != null
                && userRepository.existsByEmail(request.email())) {
            throw new ConflictException(
                    "Email is already used"
            );
        }

        User user = new User();

        user.setNickname(request.nickname());
        user.setPassword(
                passwordEncoder.encode(request.password())
        );
        user.setEmail(request.email());
        user.setName(request.name());
        user.setLastName(request.lastName());
        user.setPhone(request.phone());
        user.setRole(userRepository.count() == 0 ? UserRoles.ADMIN : UserRoles.USER);
        user.setOnlineStatus(UserStatus.OFFLINE);

        User savedUser = userRepository.save(user);

        String token = jwtService.generateToken(savedUser);

        return new AuthResponse(
                token,
                "Bearer",
                jwtService.getExpirationSeconds()
        );
    }

    @Transactional
    public TwoFactorChallengeResponse login(LoginRequest request) {
        if (!StringUtils.hasText(request.email())) {
            throw new IllegalArgumentException("Email is required");
        }

        Authentication authentication =
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                request.email(),
                                request.password()
                        )
                );

        User user = userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found"
                        )
                );

        return createTwoFactorChallenge(user);
    }

    @Transactional
    public TwoFactorChallengeResponse loginByNickname(NicknameLoginRequest request) {
        if (!StringUtils.hasText(request.nickname())) {
            throw new IllegalArgumentException("Nickname is required");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.nickname(),
                        request.password()
                )
        );

        User user = userRepository
                .findByNickname(request.nickname())
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found"
                        )
                );

        return createTwoFactorChallenge(user);
    }

    @Transactional
    public AuthResponse verifyEmailCode(VerifyEmailCodeRequest request) {
        if (!StringUtils.hasText(request.verificationId()) || !StringUtils.hasText(request.code())) {
            throw new IllegalArgumentException("Verification id and code are required");
        }

        EmailVerificationCode verificationCode = emailVerificationCodeRepository
                .findByVerificationIdAndUsedFalse(request.verificationId())
                .orElseThrow(() -> new ResourceNotFoundException("Verification code not found"));

        if (verificationCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            verificationCode.setUsed(true);
            emailVerificationCodeRepository.save(verificationCode);
            throw new IllegalArgumentException("Verification code expired");
        }

        if (!passwordEncoder.matches(request.code(), verificationCode.getCodeHash())) {
            throw new IllegalArgumentException("Verification code is incorrect");
        }

        verificationCode.setUsed(true);
        emailVerificationCodeRepository.save(verificationCode);

        User tokenUser = verificationCode.getUser();
        if (tokenUser.isBannedStatus()) {
            throw new ForbiddenActionException("Your account has been banned");
        }

        String token = jwtService.generateToken(tokenUser);

        return new AuthResponse(
                token,
                "Bearer",
                jwtService.getExpirationSeconds()
        );
    }

    private TwoFactorChallengeResponse createTwoFactorChallenge(User user) {
        if (!StringUtils.hasText(user.getEmail())) {
            throw new IllegalArgumentException("User does not have an email for two factor authentication");
        }

        String code = twoFactorEmailEnabled
                ? String.format("%06d", secureRandom.nextInt(1_000_000))
                : getLocalTwoFactorCode();
        EmailVerificationCode verificationCode = new EmailVerificationCode();
        verificationCode.setUser(user);
        verificationCode.setVerificationId(UUID.randomUUID().toString());
        verificationCode.setCodeHash(passwordEncoder.encode(code));
        verificationCode.setExpiresAt(LocalDateTime.now().plusSeconds(TWO_FACTOR_EXPIRES_IN_SECONDS));
        verificationCode.setCreatedAt(LocalDateTime.now());
        verificationCode.setUsed(false);

        EmailVerificationCode saved = emailVerificationCodeRepository.save(verificationCode);
        if (twoFactorEmailEnabled) {
            emailService.sendTwoFactorCode(user.getEmail(), code);
        }

        return new TwoFactorChallengeResponse(
                true,
                saved.getVerificationId(),
                TWO_FACTOR_EXPIRES_IN_SECONDS
        );
    }

    private String getLocalTwoFactorCode() {
        if (StringUtils.hasText(twoFactorTestCode) && twoFactorTestCode.matches("\\d{6}")) {
            return twoFactorTestCode;
        }
        return "000000";
    }
}
