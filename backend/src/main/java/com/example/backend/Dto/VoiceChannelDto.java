package com.example.backend.Dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VoiceChannelDto {
    private long id;
    private String chatRoomId;
    private String voiceChannelName;
    private Integer maxUsers;
}
