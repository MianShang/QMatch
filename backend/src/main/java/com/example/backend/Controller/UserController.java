package com.example.backend.Controller;


import com.example.backend.Dto.Request.UserRequestDto;
import com.example.backend.Dto.UserDto;
import com.example.backend.Entity.User;
import com.example.backend.Repository.UserRepository;
import com.example.backend.Security.MyUserDetailsService;
import com.example.backend.Service.EmailService;
import com.example.backend.Service.UserService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private final UserService userService;
    private final EmailService emailService;

    // 아이디 중복 체크 API
    @GetMapping("/api/user/check-id")
    public ResponseEntity<String> checkUserId(@RequestParam String userId) {
        if (userRepository.existsByUserId(userId)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("이미 사용 중인 아이디입니다.");
        }
        return ResponseEntity.ok("사용 가능한 아이디입니다.");
    }

    // 이메일 인증 코드 발송 API
    @PostMapping("/api/user/send-email-verification")
    public ResponseEntity<String> sendEmailVerification(@RequestParam String email) {
        try {
            String result = emailService.sendVerificationEmail(email);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // 이메일 인증 코드 검증 API
    @PostMapping("/api/user/verify-email")
    public ResponseEntity<String> verifyEmail(@RequestParam String email, @RequestParam String code) {
        if (emailService.verifyEmailCode(email, code)) {
            return ResponseEntity.ok("이메일 인증이 완료되었습니다.");
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("인증 코드가 일치하지 않습니다.");
    }

    // 회원가입 API
    @PostMapping("/api/user/join")
    public ResponseEntity<String> userJoin(@Valid @RequestBody UserRequestDto user) {
        try {
            // Service 레이어 분리
            userService.saveUser(user);
            return ResponseEntity.ok("회원가입 성공");

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    // 로그인 성공시 반환
    @GetMapping("/loginOk")
    public ResponseEntity<String> loginOk() {
        return ResponseEntity.ok("로그인 성공");
    }

    // 로그아웃 성공시 반환
    @GetMapping("/logoutOk")
    public ResponseEntity<String> logoutOk() {
        return ResponseEntity.ok("로그아웃 성공");
    }



}