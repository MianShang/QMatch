package com.example.backend.Dto.Response;

import lombok.Data;
import lombok.Setter;

@Data
public class AgoraTokenResponseDto {
    private String token;

    public AgoraTokenResponseDto(String token) {
        this.token = token;
    }
}
