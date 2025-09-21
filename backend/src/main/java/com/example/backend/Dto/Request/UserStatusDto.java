package com.example.backend.Dto.Request;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class UserStatusDto {
    private String userId;   // 프론트 훅에서 보냄
    private String status;   // "온라인" | "자리비움" | "오프라인"
}
