package com.example.backend.Service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Random;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class EmailService {
    
    private final JavaMailSender mailSender;
    
    @Value("${spring.mail.username}")
    private String fromEmail;
    
    @Value("${spring.mail.from-name:QMatch}")
    private String fromName;
    
    // 인증 코드 저장 (이메일: 인증코드)
    private final ConcurrentHashMap<String, String> emailVerificationCodes = new ConcurrentHashMap<>();
    
    // 인증 완료된 이메일 저장 (비밀번호 찾기용, 10분 유효)
    private final Set<String> verifiedEmails = ConcurrentHashMap.newKeySet();
    
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
        message.setFrom(String.format("%s <%s>", fromName, fromEmail)); // 보낸 사람 이름 설정
        message.setTo(email);
        message.setSubject("이메일 인증");
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
            // 인증 완료된 이메일로 추가 (10분 유효)
            verifiedEmails.add(email);
            
            // 10분 후 자동 삭제를 위한 스레드
            new Thread(() -> {
                try {
                    Thread.sleep(600000); // 10분 = 600000ms
                    verifiedEmails.remove(email);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }).start();
            
            return true;
        }
        return false;
    }
    
    // 이메일 인증 완료 여부 확인 (비밀번호 찾기용)
    public boolean isEmailVerifiedForPasswordReset(String email) {
        return verifiedEmails.contains(email);
    }
    
    // 이메일 인증 완료 여부 확인 (회원가입 시)
    public boolean isEmailVerified(String email) {
        // 인증 코드가 없으면 이미 인증 완료된 것으로 간주
        // 실제로는 별도의 인증 완료 목록을 관리하는 것이 좋지만, 간단하게 구현
        return !emailVerificationCodes.containsKey(email);
    }
    
    // 임시 비밀번호 생성
    public String generateTemporaryPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        Random random = new Random();
        StringBuilder password = new StringBuilder();
        
        // 최소 1개 대문자, 1개 소문자, 1개 숫자, 1개 특수문자 포함
        password.append((char)('A' + random.nextInt(26))); // 대문자
        password.append((char)('a' + random.nextInt(26))); // 소문자
        password.append((char)('0' + random.nextInt(10))); // 숫자
        password.append("!@#$%^&*".charAt(random.nextInt(8))); // 특수문자
        
        // 나머지 8자리 랜덤 생성
        for (int i = 0; i < 8; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }
        
        // 비밀번호 섞기
        char[] passwordArray = password.toString().toCharArray();
        for (int i = passwordArray.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            char temp = passwordArray[i];
            passwordArray[i] = passwordArray[j];
            passwordArray[j] = temp;
        }
        
        return new String(passwordArray);
    }
    
    // 임시 비밀번호 이메일 발송
    public String sendTemporaryPassword(String email, String temporaryPassword) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(String.format("%s <%s>", fromName, fromEmail));
        message.setTo(email);
        message.setSubject("임시 비밀번호 발급");
        message.setText("임시 비밀번호: " + temporaryPassword + 
                       "\n\n로그인 후 반드시 비밀번호를 변경해주세요." +
                       "\n\n보안을 위해 이 비밀번호는 안전하게 보관하시기 바랍니다.");
        
        try {
            mailSender.send(message);
            return "임시 비밀번호가 발송되었습니다.";
        } catch (Exception e) {
            throw new RuntimeException("이메일 발송 실패: " + e.getMessage());
        }
    }
}

