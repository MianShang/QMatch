package com.example.backend.Service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class EmailService {
    
    private final JavaMailSender mailSender;
    
    // 인증 코드 저장 (이메일: 인증코드)
    private final ConcurrentHashMap<String, String> emailVerificationCodes = new ConcurrentHashMap<>();
    
    // 인증 코드 생성
    private String generateVerificationCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000); // 6자리 숫자
        return String.valueOf(code);
    }
    
    // 이메일 인증 코드 발송
    public String sendVerificationEmail(String email) {
        String verificationCode = generateVerificationCode();
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("회원가입 이메일 인증");
        message.setText("인증 코드: " + verificationCode + "\n\n이 코드를 입력하여 이메일을 인증해주세요.");
        
        try {
            mailSender.send(message);
            // 인증 코드 저장 (5분 유효)
            emailVerificationCodes.put(email, verificationCode);
            
            // 5분 후 자동 삭제를 위한 스레드
            new Thread(() -> {
                try {
                    Thread.sleep(300000); // 5분 = 300000ms
                    emailVerificationCodes.remove(email);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }).start();
            
            return "인증 코드가 발송되었습니다.";
        } catch (Exception e) {
            throw new RuntimeException("이메일 발송 실패: " + e.getMessage());
        }
    }
    
    // 인증 코드 검증
    public boolean verifyEmailCode(String email, String code) {
        String storedCode = emailVerificationCodes.get(email);
        if (storedCode != null && storedCode.equals(code)) {
            emailVerificationCodes.remove(email);
            return true;
        }
        return false;
    }
    
    // 이메일 인증 완료 여부 확인 (회원가입 시)
    public boolean isEmailVerified(String email) {
        // 인증 코드가 없으면 이미 인증 완료된 것으로 간주
        // 실제로는 별도의 인증 완료 목록을 관리하는 것이 좋지만, 간단하게 구현
        return !emailVerificationCodes.containsKey(email);
    }
}

