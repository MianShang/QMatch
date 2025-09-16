package com.example.backend.Controller;

import com.example.backend.Dto.Request.ReportStatusRequestDto;
import com.example.backend.Dto.Response.ReportResponseDto;
import com.example.backend.Dto.Response.UserResponseDto;
import com.example.backend.Service.AdminService;
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

    // 회원 목록
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponseDto> getAllUsers() {
        return adminService.getAllUsers();
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
    public ResponseEntity<String> suspendUser(@PathVariable String userId, @RequestBody ReportStatusRequestDto request) {
        adminService.suspendUser(request.getReportId(),userId);
        return ResponseEntity.ok(userId + " 3일 정지");
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