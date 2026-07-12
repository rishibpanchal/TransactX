package com.transactx.api.service;

import com.transactx.api.config.JwtTokenProvider;
import com.transactx.api.domain.RefreshToken;
import com.transactx.api.domain.Role;
import com.transactx.api.domain.User;
import com.transactx.api.dto.AuthDto;
import com.transactx.api.exception.AuthenticationException;
import com.transactx.api.exception.ResourceNotFoundException;
import com.transactx.api.repository.RefreshTokenRepository;
import com.transactx.api.repository.RoleRepository;
import com.transactx.api.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuditService auditService;

    public AuthServiceImpl(
            UserRepository userRepository,
            RoleRepository roleRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider tokenProvider,
            AuditService auditService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.auditService = auditService;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        List<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName()))
                .collect(Collectors.toList());

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash(),
                !user.isAccountLocked(),
                true,
                true,
                true,
                authorities
        );
    }

    @Override
    @Transactional
    public AuthDto.LoginResponse registerUser(AuthDto.RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AuthenticationException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AuthenticationException("Email is already registered");
        }

        Set<Role> roles = new HashSet<>();
        for (String roleName : request.getRoles()) {
            String fullRoleName = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName.toUpperCase();
            Role role = roleRepository.findByName(fullRoleName)
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + fullRoleName));
            roles.add(role);
        }

        User user = User.builder()
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullName())
                .accountLocked(false)
                .failedLoginAttempts(0)
                .roles(roles)
                .build();

        User savedUser = userRepository.save(user);

        // Generate tokens
        UserDetails userDetails = loadUserByUsername(savedUser.getUsername());
        String accessToken = tokenProvider.generateToken(userDetails);
        String refreshToken = generateAndSaveRefreshToken(savedUser);

        auditService.log(savedUser.getId(), "USER_REGISTERED", "0.0.0.0", "SYSTEM", null, Map.of("username", savedUser.getUsername()), null);

        return AuthDto.LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .roles(request.getRoles())
                .build();
    }

    @Override
    @Transactional
    public AuthDto.LoginResponse login(AuthDto.LoginRequest request, String ipAddress, String device) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AuthenticationException("Invalid username or password"));

        // Check locking status
        if (user.isAccountLocked()) {
            if (user.getLockTime() != null && user.getLockTime().plusMinutes(15).isBefore(LocalDateTime.now())) {
                // Auto unlock after 15 mins
                user.setAccountLocked(false);
                user.setFailedLoginAttempts(0);
                user.setLockTime(null);
                userRepository.save(user);
                auditService.log(user.getId(), "ACCOUNT_AUTO_UNLOCKED", ipAddress, device, null, null, null);
            } else {
                throw new AuthenticationException("Account is locked due to multiple failed login attempts. Try again later.");
            }
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            handleFailedLogin(user.getUsername());
            throw new AuthenticationException("Invalid username or password");
        }

        // Reset failed login attempts on successful login
        resetFailedAttempts(user.getUsername());

        UserDetails userDetails = loadUserByUsername(user.getUsername());
        String accessToken = tokenProvider.generateToken(userDetails);
        String refreshToken = generateAndSaveRefreshToken(user);

        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        auditService.log(user.getId(), "USER_LOGIN", ipAddress, device, null, null, null);

        return AuthDto.LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(roles)
                .build();
    }

    @Override
    @Transactional
    public AuthDto.TokenRefreshResponse refreshToken(AuthDto.TokenRefreshRequest request) {
        RefreshToken token = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new AuthenticationException("Invalid refresh token"));

        if (token.isRevoked() || token.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new AuthenticationException("Refresh token is expired or revoked");
        }

        User user = token.getUser();
        UserDetails userDetails = loadUserByUsername(user.getUsername());
        String newAccessToken = tokenProvider.generateToken(userDetails);
        
        // Rotate refresh token
        token.setRevoked(true);
        refreshTokenRepository.save(token);
        String newRefreshToken = generateAndSaveRefreshToken(user);

        return AuthDto.TokenRefreshResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }

    @Override
    @Transactional
    public void logout(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            String jwt = token.substring(7);
            tokenProvider.blacklistToken(jwt);
            
            // Revoke active refresh tokens for the user associated with this token
            try {
                String username = tokenProvider.getUsernameFromToken(jwt);
                userRepository.findByUsername(username).ifPresent(user -> {
                    refreshTokenRepository.deleteByUser(user);
                    auditService.log(user.getId(), "USER_LOGOUT", null, null, null, null, null);
                });
            } catch (Exception e) {
                // Token might be already invalid or expired, ignore
            }
        }
    }

    @Override
    public AuthDto.UserProfileResponse getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        return AuthDto.UserProfileResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roles)
                .build();
    }

    @Override
    @Transactional
    public void changePassword(String username, AuthDto.ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new AuthenticationException("Incorrect current password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        auditService.log(user.getId(), "PASSWORD_CHANGED", null, null, null, null, null);
    }

    @Override
    @Transactional
    public AuthDto.UserProfileResponse updateProfile(String username, AuthDto.UpdateProfileRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Map<String, Object> oldValues = Map.of("fullName", user.getFullName(), "email", user.getEmail());

        // Check email uniqueness if email is changing
        if (!user.getEmail().equalsIgnoreCase(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new AuthenticationException("Email is already registered by another account");
        }

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        User updated = userRepository.save(user);

        Map<String, Object> newValues = Map.of("fullName", updated.getFullName(), "email", updated.getEmail());
        auditService.log(user.getId(), "PROFILE_UPDATED", null, null, oldValues, newValues, null);

        List<String> roles = updated.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        return AuthDto.UserProfileResponse.builder()
                .userId(updated.getId())
                .username(updated.getUsername())
                .email(updated.getEmail())
                .fullName(updated.getFullName())
                .roles(roles)
                .build();
    }

    @Override
    @Transactional
    public void handleFailedLogin(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            int newAttempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(newAttempts);
            if (newAttempts >= 5) {
                user.setAccountLocked(true);
                user.setLockTime(LocalDateTime.now());
                auditService.log(user.getId(), "ACCOUNT_LOCKED_FAILED_LOGINS", null, null, null, null, null);
            }
            userRepository.save(user);
        });
    }

    @Override
    @Transactional
    public void resetFailedAttempts(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            if (user.getFailedLoginAttempts() > 0) {
                user.setFailedLoginAttempts(0);
                user.setLockTime(null);
                userRepository.save(user);
            }
        });
    }

    private String generateAndSaveRefreshToken(User user) {
        String tokenStr = UUID.randomUUID().toString();
        RefreshToken token = RefreshToken.builder()
                .user(user)
                .token(tokenStr)
                .expiryDate(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();
        refreshTokenRepository.save(token);
        return tokenStr;
    }
}
