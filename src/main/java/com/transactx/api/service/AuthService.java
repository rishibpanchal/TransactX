package com.transactx.api.service;

import com.transactx.api.dto.AuthDto;
import org.springframework.security.core.userdetails.UserDetailsService;
import java.util.UUID;

public interface AuthService extends UserDetailsService {
    AuthDto.LoginResponse registerUser(AuthDto.RegisterRequest request);
    AuthDto.LoginResponse login(AuthDto.LoginRequest request, String ipAddress, String device);
    AuthDto.TokenRefreshResponse refreshToken(AuthDto.TokenRefreshRequest request);
    void logout(String token);
    AuthDto.UserProfileResponse getCurrentUser(String username);
    void changePassword(String username, AuthDto.ChangePasswordRequest request);
    AuthDto.UserProfileResponse updateProfile(String username, AuthDto.UpdateProfileRequest request);
    void handleFailedLogin(String username);
    void resetFailedAttempts(String username);
}
