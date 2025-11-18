package com.example.backend.Dto.Request;

import lombok.Data;

@Data
public class AgoraTokenRequestDto {
    private String channelName;
    private String uid;
}
