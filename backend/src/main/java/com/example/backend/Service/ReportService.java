package com.example.backend.Service;

import com.example.backend.Entity.Report;
import com.example.backend.Entity.ReportStatus;
import com.example.backend.Entity.User;
import com.example.backend.Repository.ReportRepository;
import com.example.backend.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    @Transactional // 데이터를 DB에 저장하므로 @Transactional 어노테이션이 필요합니다.
    public void createReport(String reporterId, String reportedUserId, String reason, String details, MultipartFile file) throws IOException {

        // 1. 신고자와 피신고자의 User 엔티티를 조회합니다.
        User reporter = userRepository.findByUserId(reporterId)
                .orElseThrow(() -> new IllegalArgumentException("신고자를 찾을 수 없습니다: " + reporterId));
        User reportedUser = userRepository.findByUserId(reportedUserId)
                .orElseThrow(() -> new IllegalArgumentException("신고 대상자를 찾을 수 없습니다: " + reportedUserId));

        String attachmentPath = null;
        // 2. 첨부 파일이 있다면 서버에 저장합니다.
        if (file != null && !file.isEmpty()) {
            String uploadPath = new File("uploads/reports").getAbsolutePath();
            File uploadDir = new File(uploadPath);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            File dest = new File(uploadDir, fileName);
            file.transferTo(dest);
            attachmentPath = "/uploads/reports/" + fileName; // DB에 저장할 경로
        }

        // 3. Report 객체를 생성하고 데이터를 설정합니다.
        Report report = new Report();
        report.setReporter(reporter);
        report.setReportedUser(reportedUser);
        report.setReason(reason);
        report.setStatus(ReportStatus.PENDING); // 초기 상태는 '처리 대기 중'

        if(details != null) {
            report.setDetails(details);
        }
        if(attachmentPath != null) {
            report.setAttachmentUrl(attachmentPath);
        }

        // 4. ReportRepository를 통해 DB에 저장합니다.
        reportRepository.save(report);
    }
}