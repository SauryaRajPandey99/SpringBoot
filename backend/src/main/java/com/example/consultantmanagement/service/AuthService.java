package com.example.consultantmanagement.service;

import java.util.Locale;

import com.example.consultantmanagement.dto.AuthRequest;
import com.example.consultantmanagement.dto.AuthResponse;
import com.example.consultantmanagement.dto.RegisterResponse;
import com.example.consultantmanagement.entity.AppUser;
import com.example.consultantmanagement.exception.DuplicateAccountException;
import com.example.consultantmanagement.repository.AppUserRepository;
import com.example.consultantmanagement.security.JwtTokenService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;

    public AuthService(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenService jwtTokenService) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
    }

    public RegisterResponse register(AuthRequest request) {
        String email = normalizeEmail(request.getEmail());

        if (appUserRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateAccountException("An account already exists with this email. Please log in.");
        }

        AppUser user = new AppUser();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        appUserRepository.save(user);

        return new RegisterResponse("Account created. Please log in.", email);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(AuthRequest request) {
        String email = normalizeEmail(request.getEmail());
        AppUser user = appUserRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password.");
        }

        return new AuthResponse(jwtTokenService.createToken(user.getEmail()), user.getEmail());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}

