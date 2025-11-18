package com.example.backend.Controller;

import com.example.backend.Dto.Response.UserResponseDto;
import com.example.backend.Dto.UserDto;
import com.example.backend.Security.MyUserDetailsService;
import com.example.backend.Service.AuthService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // 로그인 여부 체크 API
    @GetMapping("/api/check-login")
    public ResponseEntity<?> checkLogin(HttpSession session) {

        // 로그인 여부 Service
        boolean isLoggedIn = authService.isLoggedIn(session);

        if(isLoggedIn) {
            return ResponseEntity.ok().build(); // 로그인 되어 있음
        } else {
            return ResponseEntity.status(401).build(); // 로그인 안 되어 있음
        }

    }

    // 유저 정보 반환 API
    @GetMapping("/api/user/get-data")
    public ResponseEntity<?> getData(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        try {
            UserResponseDto userResponseDto = authService.getUserData(auth);
            return ResponseEntity.ok(userResponseDto);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body("서버 내부 오류: " + e.getMessage());
        }
    }
}
