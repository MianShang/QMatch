package com.example.backend.Service;

import com.example.backend.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Random;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EmailService {
    
    private final JavaMailSender mailSender;
    private final UserRepository userRepository;
    
    @Value("${spring.mail.username}")
    private String fromEmail;
    
    @Value("${spring.mail.from-name:QMatch}")
    private String fromName;
    
    // 인증 코드 저장 (이메일: 인증코드)
    private final ConcurrentHashMap<String, String> emailVerificationCodes = new ConcurrentHashMap<>();
    
    // 인증 코드 발송 시간 저장 (이메일: 발송시간) - 중복 발송 방지용
    private final ConcurrentHashMap<String, LocalDateTime> emailVerificationSendTimes = new ConcurrentHashMap<>();
    
    // 이메일별 발송 중 락 (동시성 제어용)
    private final ConcurrentHashMap<String, ReentrantLock> emailLocks = new ConcurrentHashMap<>();
    
    // 인증 완료된 이메일 저장 (비밀번호 찾기용, 10분 유효)
    private final Set<String> verifiedEmails = ConcurrentHashMap.newKeySet();
    
    // 회원가입용 인증 완료된 이메일 저장
    private final Set<String> verifiedEmailsForSignup = ConcurrentHashMap.newKeySet();
    
    // 최소 재발송 대기 시간 (초) - 60초
    private static final long MIN_RESEND_INTERVAL_SECONDS = 60;
    
    // 인증 코드 생성
    private String generateVerificationCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000); // 6자리 숫자
        return String.valueOf(code);
    }
    
    // 이메일 인증 코드 발송 (회원가입용 - 이미 등록된 이메일이 아니어야 함)
    public String sendVerificationEmail(String email) {
        // 이미 등록된 이메일인지 확인
        if (userRepository.findByUserEmail(email).isPresent()) {
            throw new IllegalArgumentException("이미 등록된 이메일입니다.");
        }
        
        return sendVerificationEmailInternal(email);
    }
    
    // 비밀번호 찾기용 이메일 인증 코드 발송 (아이디와 이메일이 일치해야 함)
    public String sendVerificationEmailForPasswordReset(String userId, String email) {
        // 아이디로 사용자 찾기
        var user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 아이디로 등록된 사용자가 없습니다."));
        
        // 아이디와 이메일이 일치하는지 확인
        if (!user.getUserEmail().equals(email)) {
            throw new IllegalArgumentException("아이디와 이메일이 일치하지 않습니다.");
        }
        
        return sendVerificationEmailInternal(email);
    }
    
    // 아이디 찾기용 이메일 인증 코드 발송 (등록된 이메일이어야 함)
    public String sendVerificationEmailForFindId(String email) {
        // 등록된 이메일인지 확인
        if (userRepository.findByUserEmail(email).isEmpty()) {
            throw new IllegalArgumentException("해당 이메일로 등록된 사용자가 없습니다.");
        }
        
        return sendVerificationEmailInternal(email);
    }
    
    // 내부 이메일 인증 코드 발송 메서드
    private String sendVerificationEmailInternal(String email) {
        // 이메일별 락 가져오기 (없으면 생성)
        ReentrantLock lock = emailLocks.computeIfAbsent(email, k -> new ReentrantLock());
        
        // 락 획득 시도 (동시 요청 방지)
        if (!lock.tryLock()) {
            throw new IllegalArgumentException("인증 코드 발송이 이미 진행 중입니다. 잠시 후 다시 시도해주세요.");
        }
        
        try {
            // 중복 발송 방지: 이미 발송된 코드가 있고 아직 유효한 경우
            if (emailVerificationCodes.containsKey(email)) {
                LocalDateTime lastSendTime = emailVerificationSendTimes.get(email);
                if (lastSendTime != null) {
                    long secondsSinceLastSend = java.time.Duration.between(lastSendTime, LocalDateTime.now()).getSeconds();
                    if (secondsSinceLastSend < MIN_RESEND_INTERVAL_SECONDS) {
                        long remainingSeconds = MIN_RESEND_INTERVAL_SECONDS - secondsSinceLastSend;
                        throw new IllegalArgumentException(String.format("인증 코드는 %d초 후에 다시 발송할 수 있습니다. (남은 시간: %d초)", 
                            MIN_RESEND_INTERVAL_SECONDS, remainingSeconds));
                    }
                }
            }
            
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
                // 발송 시간 저장
                emailVerificationSendTimes.put(email, LocalDateTime.now());
                
                // 5분 후 자동 삭제를 위한 스레드
                new Thread(() -> {
                    try {
                        Thread.sleep(300000); // 5분 = 300000ms
                        emailVerificationCodes.remove(email);
                        emailVerificationSendTimes.remove(email);
                        // 락도 정리 (5분 후, 사용하지 않는 락 제거)
                        emailLocks.remove(email);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }).start();
                
                return "인증 코드가 발송되었습니다.";
            } catch (Exception e) {
                throw new RuntimeException("이메일 발송 실패: " + e.getMessage());
            }
        } finally {
            // 락 해제
            lock.unlock();
        }
    }
    
    // 인증 코드 검증 (회원가입용)
    public boolean verifyEmailCode(String email, String code) {
        String storedCode = emailVerificationCodes.get(email);
        if (storedCode != null && storedCode.equals(code)) {
            emailVerificationCodes.remove(email);
            emailVerificationSendTimes.remove(email);
            // 회원가입용 인증 완료된 이메일로 추가 (10분 유효)
            verifiedEmailsForSignup.add(email);
            
            // 10분 후 자동 삭제를 위한 스레드
            new Thread(() -> {
                try {
                    Thread.sleep(600000); // 10분 = 600000ms
                    verifiedEmailsForSignup.remove(email);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }).start();
            
            return true;
        }
        return false;
    }
    
    // 인증 코드 검증 (비밀번호 찾기/아이디 찾기용)
    public boolean verifyEmailCodeForAccountRecovery(String email, String code) {
        String storedCode = emailVerificationCodes.get(email);
        if (storedCode != null && storedCode.equals(code)) {
            emailVerificationCodes.remove(email);
            emailVerificationSendTimes.remove(email);
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
        return verifiedEmailsForSignup.contains(email);
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

