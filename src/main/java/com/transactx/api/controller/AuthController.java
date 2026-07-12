package com.transactx.api.controller;

import com.transactx.api.dto.AuthDto;
import com.transactx.api.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Endpoints for user registration, login, profile updates, and JWT sessions")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new banking customer, manager, or admin")
    public ResponseEntity<AuthDto.LoginResponse> register(@Valid @RequestBody AuthDto.RegisterRequest request) {
        return ResponseEntity.ok(authService.registerUser(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and receive access and refresh tokens")
    public ResponseEntity<AuthDto.LoginResponse> login(
            @Valid @RequestBody AuthDto.LoginRequest request,
            HttpServletRequest servletRequest) {
        String ip = servletRequest.getRemoteAddr();
        String device = servletRequest.getHeader("User-Agent");
        return ResponseEntity.ok(authService.login(request, ip, device));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh an active access token using a valid refresh token")
    public ResponseEntity<AuthDto.TokenRefreshResponse> refresh(@Valid @RequestBody AuthDto.TokenRefreshRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout user and invalidate/blacklist the access token in Redis")
    public ResponseEntity<Void> logout(@RequestHeader(name = "Authorization", required = false) String token) {
        authService.logout(token);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @Operation(summary = "Retrieve current authenticated user details", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<AuthDto.UserProfileResponse> me(Principal principal) {
        return ResponseEntity.ok(authService.getCurrentUser(principal.getName()));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update full name and email for the current user", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<AuthDto.UserProfileResponse> updateProfile(
            @Valid @RequestBody AuthDto.UpdateProfileRequest request,
            Principal principal) {
        return ResponseEntity.ok(authService.updateProfile(principal.getName(), request));
    }

    @PutMapping("/change-password")
    @Operation(summary = "Change login password for current authenticated user", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> changePassword(
            @Valid @RequestBody AuthDto.ChangePasswordRequest request,
            Principal principal) {
        authService.changePassword(principal.getName(), request);
        return ResponseEntity.noContent().build();
    }
}
