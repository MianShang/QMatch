package com.example.backend.Controller;

import com.example.backend.Dto.VoiceParticipantDto;
import com.example.backend.Service.VoiceChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/voice/participants")
@RequiredArgsConstructor
public class VoiceParticipantController {
    private final VoiceChatService voiceChatService;

    // 특정 채널 참여자 목록 조회 (초기 로딩용)
    @GetMapping("/{roomId}")
    public ResponseEntity<List<VoiceParticipantDto>> getParticipants(@PathVariable String roomId) {
        return ResponseEntity.ok(voiceChatService.getParticipants(roomId));
    }

    // 특정 음성채널 참여자 목록 조회
    @GetMapping("/{roomId}/{voiceChannelId}")
    public ResponseEntity<List<VoiceParticipantDto>> getParticipantsByVoiceChannel(
            @PathVariable String roomId,
            @PathVariable String voiceChannelId) {
        return ResponseEntity.ok(voiceChatService.getParticipantsByVoiceChannel(roomId, voiceChannelId));
    }
}