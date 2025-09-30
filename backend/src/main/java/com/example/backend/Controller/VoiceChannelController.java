package com.example.backend.Controller;

import com.example.backend.Dto.VoiceChannelDto;
import com.example.backend.Service.VoiceChannelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/voice/channels")
@RequiredArgsConstructor
public class VoiceChannelController {

    private final VoiceChannelService voiceChannelService;

    // 특정 채팅방의 음성 채널 목록 조회
    @GetMapping("/{chatRoomId}")
    public ResponseEntity<List<VoiceChannelDto>> getByChatRoom(@PathVariable String chatRoomId) {
        return ResponseEntity.ok(voiceChannelService.getVoiceChannelsByChatRoom(chatRoomId));
    }

    // 음성 채널 생성
    @PostMapping
    public ResponseEntity<VoiceChannelDto> create(@RequestBody VoiceChannelDto dto) {
        return ResponseEntity.ok(voiceChannelService.createVoiceChannel(dto));
    }

    // 음성 채널 삭제
    @DeleteMapping("/delete/{channelId}")
    public ResponseEntity<Void> delete(@PathVariable Long channelId) {
        voiceChannelService.deleteVoiceChannel(channelId);
        return ResponseEntity.noContent().build();
    }
}
