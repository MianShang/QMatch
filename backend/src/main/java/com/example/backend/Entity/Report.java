package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@EntityListeners(AuditingEntityListener.class) // 생성 시간 자동화
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id") // 신고자
    private User reporter;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_user_id") // 피신고자
    private User reportedUser;

    private String reason;

    @Column(length = 1000)
    private String details;


    @Enumerated(EnumType.STRING) // 신고 상태를 문자열 형태로 저장
    private ReportStatus status;

    @CreatedDate // 엔티티 생성 될 때 시간 자동으로 생성
    @Column(updatable = false)
    private LocalDateTime createdAt;

    private String attachmentUrl;


}