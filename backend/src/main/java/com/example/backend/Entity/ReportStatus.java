package com.example.backend.Entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ReportStatus {
    PENDING("대기중"),
    RESOLVED("완료");

    private final String description;// 처리 완료


}
