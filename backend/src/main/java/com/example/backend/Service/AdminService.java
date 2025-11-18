package com.example.backend.Service;

import com.example.backend.Dto.Response.AdminUserDetailResponseDto;
import com.example.backend.Dto.Response.ChatRoomInfo;
import com.example.backend.Dto.Response.ReportResponseDto;
import com.example.backend.Dto.Response.UserResponseDto;
import com.example.backend.Entity.*;
import com.example.backend.Repository.ReportRepository;
import com.example.backend.Repository.UserChatRoomRepository;
import com.example.backend.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;
    private final ReportRepository reportRepository;
    private final UserChatRoomRepository userChatRoomRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final SessionRegistry sessionRegistry;

    // 회원 목록 조회
    public List<UserResponseDto> getAllUsers() {
        List<User> users = (List<User>) userRepository.findAll();
        return users.stream()
                .map(UserResponseDto::from)
                .collect(Collectors.toList());
    }

    // 회원 상세 정보 조회
    @Transactional(readOnly = true)
    public AdminUserDetailResponseDto getUserDetail(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다: " + userId));

        // UserChatRoomService 재사용
        List<UserChatRoom> userChatRooms = userChatRoomRepository.findByUser_UserId(userId);

        // 받아온 UserChatRoom 목록을 ChatRoomInfo DTO 목록으로 변환
        List<ChatRoomInfo> chatRoomInfos = userChatRooms.stream()
                .map(userChatRoom -> ChatRoomInfo.builder()
                        .roomId(userChatRoom.getChatRoom().getId())
                        .roomName(userChatRoom.getChatRoom().getName())
                        .build())
                .collect(Collectors.toList());

        return AdminUserDetailResponseDto.from(user, chatRoomInfos);
    }

    // 신고 내역 조회
    public List<ReportResponseDto> getAllReports() {
        List<Report> reports = reportRepository.findAllByOrderByIdDesc();
        return reports.stream()
                .map(ReportResponseDto::from)
                .collect(Collectors.toList());
    }

    // 우선 3일 정지만
    @Transactional
    public void suspendUser(Long reportId,String userId,  int days) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다: " + userId));

        user.setStatus(AccountStatus.SUSPENDED);
        user.setSuspensionEndDate(LocalDateTime.now().plusDays(days)); // 현재 시간으로부터 3일 뒤로 만료일 설정

        // 상태 변경
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("신고 건을 찾을 수 없습니다: " + reportId));
        report.setStatus(ReportStatus.RESOLVED); // 상태를 '처리 완료'로 변경

        // 해당 유저의 모든 세션 무효화
        invalidateUserSessions(userId);
        
        // 해당 유저에게 강제 로그아웃 메시지 전송
        Map<String, Object> message = new HashMap<>();
        message.put("type", "FORCE_LOGOUT");
        message.put("reason", days >= 9999 ? "영구정지" : "임시정지");
        message.put("message", days >= 9999 ? "계정이 영구정지되었습니다." : "계정이 " + days + "일간 정지되었습니다.");
        String destination = "/topic/user/" + userId + "/force-logout";
        System.out.println("🔴 [강제 로그아웃] 유저 " + userId + "에게 메시지 전송: " + destination);
        messagingTemplate.convertAndSend(destination, message);
        System.out.println("✅ [강제 로그아웃] 메시지 전송 완료");
    }

    // 영구 정지
    @Transactional
    public void banUser(Long reportId,String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다: " + userId));

        user.setStatus(AccountStatus.BANNED);
        user.setSuspensionEndDate(null);

        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("신고 건을 찾을 수 없습니다: " + reportId));
        report.setStatus(ReportStatus.RESOLVED);

        // 해당 유저의 모든 세션 무효화
        invalidateUserSessions(userId);
        
        // 해당 유저에게 강제 로그아웃 메시지 전송
        Map<String, Object> message = new HashMap<>();
        message.put("type", "FORCE_LOGOUT");
        message.put("reason", "영구정지");
        message.put("message", "계정이 영구정지되었습니다.");
        String destination = "/topic/user/" + userId + "/force-logout";
        System.out.println("🔴 [강제 로그아웃] 유저 " + userId + "에게 메시지 전송: " + destination);
        messagingTemplate.convertAndSend(destination, message);
        System.out.println("✅ [강제 로그아웃] 메시지 전송 완료");
    }

    // 계정 활성화
    @Transactional
    public void activateUser(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다: " + userId));

        user.setStatus(AccountStatus.ACTIVE);
        user.setSuspensionEndDate(null);
    }

    // 유저의 모든 세션 무효화
    private void invalidateUserSessions(String userId) {
        try {
            List<Object> allPrincipals = sessionRegistry.getAllPrincipals();
            for (Object principal : allPrincipals) {
                if (principal instanceof UserDetails) {
                    UserDetails userDetails = (UserDetails) principal;
                    if (userDetails.getUsername().equals(userId)) {
                        // 해당 유저의 모든 세션 무효화
                        sessionRegistry.getAllSessions(principal, false).forEach(sessionInformation -> {
                            sessionInformation.expireNow();
                            System.out.println("🔴 [세션 무효화] 세션 ID: " + sessionInformation.getSessionId());
                        });
                        System.out.println("✅ [세션 무효화] 유저 " + userId + "의 모든 세션이 무효화되었습니다.");
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("❌ [세션 무효화 실패] 유저 " + userId + ": " + e.getMessage());
        }
    }
}