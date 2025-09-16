package com.example.backend.Dto.Response;

import com.example.backend.Entity.Report;
import com.example.backend.Entity.ReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class ReportResponseDto {

    private Long id;
    private String reporterId;
    private String reportedUserId;
    private String reason;
    private String details;
    private String status;
    private LocalDateTime createdAt;

    public static ReportResponseDto from(Report report) {
        return ReportResponseDto.builder()
                .id(report.getId())
                .reporterId(report.getReporter().getUserId())
                .reportedUserId(report.getReportedUser().getUserId())
                .reason(report.getReason())
                .details(report.getDetails())
                .status(report.getStatus().getDescription())
                .createdAt(report.getCreatedAt())
                .build();
    }
}