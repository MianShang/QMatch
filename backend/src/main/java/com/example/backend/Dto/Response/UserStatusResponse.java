package com.example.backend.Dto.Response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserStatusResponse {
    private String userId;
    private String status;      // 한글 상태
}
