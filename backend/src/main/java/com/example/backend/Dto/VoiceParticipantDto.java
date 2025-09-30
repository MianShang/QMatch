package com.example.backend.Dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoiceParticipantDto {
    private String userId;
    private String userName;
    private String roomId;
    private String voiceChannelId;
}