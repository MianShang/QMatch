package com.example.backend.Controller;

import com.example.backend.Dto.Request.ReportStatusRequestDto;
import com.example.backend.Dto.Request.SuspensionRequestDto;
import com.example.backend.Dto.Response.AdminUserDetailResponseDto;
import com.example.backend.Dto.Response.ChatListResponseDto;
import com.example.backend.Dto.Response.ReportResponseDto;
import com.example.backend.Dto.Response.UserResponseDto;
import com.example.backend.Service.AdminService;
import com.example.backend.Service.ChatListService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final ChatListService chatListService;


    // 회원 목록
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponseDto> getAllUsers() {
        return adminService.getAllUsers();
    }


    // 유저 상세 정보 조회
    @GetMapping("/users/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public AdminUserDetailResponseDto getUserDetail(@PathVariable String userId) {
        return adminService.getUserDetail(userId);
    }

    // 채팅 로그 조회
    @GetMapping("/chat-logs/{roomId}")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ChatListResponseDto> getChatLogsByRoomId(@PathVariable String roomId) {
        // 기존 ChatListService의 메서드를 재사용
        return chatListService.getChatList(roomId);
    }

    // 신고 내역
    @GetMapping("/reports")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ReportResponseDto> getAllReports() {
        return adminService.getAllReports();
    }

    // 임시 정지
    @PostMapping("/users/{userId}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> suspendUser(@PathVariable String userId, @RequestBody SuspensionRequestDto request) {
        adminService.suspendUser(request.getReportId(), userId, request.getDays());


        String message;
        if (request.getDays() >= 9999) {
            message = userId + "님이 영구정지 되었습니다.";
        } else {
            message = userId + "님이 " + request.getDays() + "일간 정지되었습니다.";
        }

        return ResponseEntity.ok(message);
    }

    // 영구 정지
    @PostMapping("/users/{userId}/ban")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> banUser(@PathVariable String userId, @RequestBody ReportStatusRequestDto request) {
        adminService.banUser(request.getReportId(),userId);
        return ResponseEntity.ok(userId + " 영구 정지");
    }

    // 계정 활성화
    @PostMapping("/users/{userId}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> activateUser(@PathVariable String userId) {
        adminService.activateUser(userId);
        return ResponseEntity.ok(userId + " 정지가 풀렸습니다.");
    }
}