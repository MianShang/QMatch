package com.example.backend.Controller;

import com.example.backend.Dto.VoiceChannelDto;
import com.example.backend.Service.VoiceChannelService;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/voice/channels")
@RequiredArgsConstructor
public class VoiceChannelController {
    private final VoiceChannelService voiceChannelService;

    // 채널 목록 조회
    @GetMapping("/chat-room/{chatRoomId}")
    public ResponseEntity<List<VoiceChannelDto>> getByChatRoom(@PathVariable String chatRoomId) {
        return ResponseEntity.ok(voiceChannelService.getVoiceChannelsByChatRoom(chatRoomId));
    }

    // 채널 생성
    @PostMapping
    public ResponseEntity<VoiceChannelDto> create(@RequestBody VoiceChannelDto dto) {
        VoiceChannelDto created = voiceChannelService.createVoiceChannel(dto);
        if (created == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(created);
    }

    // 채널 삭제
    @DeleteMapping("/{voiceChannelId}")
    public ResponseEntity<Void> delete(@PathVariable Long voiceChannelId) {
        boolean deleted = voiceChannelService.deleteVoiceChannel(voiceChannelId);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
