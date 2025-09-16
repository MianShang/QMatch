package com.example.backend.Service;

import com.example.backend.Dto.Response.ReportResponseDto;
import com.example.backend.Dto.Response.UserResponseDto;
import com.example.backend.Entity.AccountStatus;
import com.example.backend.Entity.Report;
import com.example.backend.Entity.ReportStatus;
import com.example.backend.Entity.User;
import com.example.backend.Repository.ReportRepository;
import com.example.backend.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;
    private final ReportRepository reportRepository;

    // 회원 목록 조회
    public List<UserResponseDto> getAllUsers() {
        List<User> users = (List<User>) userRepository.findAll();
        return users.stream()
                .map(UserResponseDto::from)
                .collect(Collectors.toList());
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
    public void suspendUser(Long reportId,String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다: " + userId));

        user.setStatus(AccountStatus.SUSPENDED);
        user.setSuspensionEndDate(LocalDateTime.now().plusDays(3)); // 현재 시간으로부터 3일 뒤로 만료일 설정

        // 상태 변경
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("신고 건을 찾을 수 없습니다: " + reportId));
        report.setStatus(ReportStatus.RESOLVED); // 상태를 '처리 완료'로 변경
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
    }

    // 계정 활성화
    @Transactional
    public void activateUser(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다: " + userId));

        user.setStatus(AccountStatus.ACTIVE);
        user.setSuspensionEndDate(null);
    }
}