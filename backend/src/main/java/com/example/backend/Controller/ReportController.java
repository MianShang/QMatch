package com.example.backend.Controller;

import com.example.backend.Service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping("/reports")
    @PreAuthorize("isAuthenticated()") // 모든 사용자가 신고 기능 사용할 수 있게
    public ResponseEntity<String> createReport(
            @RequestParam("reporterId") String reporterId,
            @RequestParam("reportedUserId") String reportedUserId,
            @RequestParam("reason") String reason,
            @RequestParam("details") String details,
            @RequestParam(value = "file", required = false) MultipartFile file
    ) {
        try {
            reportService.createReport(reporterId, reportedUserId, reason, details, file);
            return ResponseEntity.ok("신고가 성공적으로 접수되었습니다.");
        } catch (IOException e) {
            return ResponseEntity.status(500).body("파일 업로드 중 오류가 발생했습니다.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}