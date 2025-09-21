package com.example.backend.Entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AccountStatus {
    ACTIVE("활성 상태"),
    SUSPENDED("임시 정지"),
    BANNED("영구 정지");

    private final String description;  // 영구 정지 상태


}