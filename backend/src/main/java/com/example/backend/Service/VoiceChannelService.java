package com.example.backend.Service;

import com.example.backend.Dto.VoiceChannelDto;
import com.example.backend.Entity.VoiceChannel;
import com.example.backend.Entity.ChatRoom;
import com.example.backend.Repository.VoiceChannelRepository;
import com.example.backend.Repository.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VoiceChannelService {
    private final VoiceChannelRepository voiceChannelRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // 음성 채널 생성
    public VoiceChannelDto createVoiceChannel(VoiceChannelDto dto) {

        // ChatRoom 조회
        ChatRoom chatRoom = chatRoomRepository.findById(dto.getChatRoomId())
                .orElseThrow(() -> new RuntimeException("채팅방을 찾을 수 없습니다: " + dto.getChatRoomId()));

        VoiceChannel voiceChannel = new VoiceChannel();
        voiceChannel.setChatRoom(chatRoom);
        voiceChannel.setChannelName(dto.getVoiceChannelName());
        voiceChannel.setMaxUsers(dto.getMaxUsers());

        VoiceChannel saved = voiceChannelRepository.save(voiceChannel);

        VoiceChannelDto result = convertToDto(saved);

        // WebSocket으로 채널 생성 알림 브로드캐스트
        String destination = "/topic/chat/" + dto.getChatRoomId() + "/voice-channel-created";
        messagingTemplate.convertAndSend(destination, result);

        return result;
    }

    // 특정 채팅방의 음성 채널 목록 조회
    public List<VoiceChannelDto> getVoiceChannelsByChatRoom(String chatRoomId) {
        List<VoiceChannel> channels = voiceChannelRepository.findByChatRoomId(chatRoomId);
        return channels.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // 음성 채널 삭제
    public void deleteVoiceChannel(Long channelId) {
        System.out.println("[VoiceChannelService] deleteVoiceChannel 호출됨: " + channelId);
        VoiceChannel voiceChannel = voiceChannelRepository.findById(channelId)
                .orElseThrow(() -> new RuntimeException("음성 채널을 찾을 수 없습니다: " + channelId));

        String chatRoomId = voiceChannel.getChatRoom().getId();
        System.out.println("[VoiceChannelService] chatRoomId = " + chatRoomId);

        // DB에서 삭제
        voiceChannelRepository.delete(voiceChannel);

        System.out.println("[VoiceChannelService] 브로드캐스트 시작");
        // 모든 유저에게 "채널 삭제됨" 이벤트 브로드캐스트
        VoiceChannelDeletedEvent event = new VoiceChannelDeletedEvent(chatRoomId, channelId);
        messagingTemplate.convertAndSend("/topic/voice/channel-deleted", event);

        // 모든 유저에게 참여자 초기화 (해당 채널 참가자 비움)
        messagingTemplate.convertAndSend(
                "/topic/voice-participants",
                Map.of("roomId", chatRoomId, "participants", List.of())
        );
        System.out.println("[VoiceChannelService] 브로드캐스트 완료");
    }

    // 내부 static class (삭제 이벤트 DTO)
    public record VoiceChannelDeletedEvent(String chatRoomId, Long voiceChannelId) {}

    // Entity to DTO
    private VoiceChannelDto convertToDto(VoiceChannel entity) {
        VoiceChannelDto dto = new VoiceChannelDto();
        dto.setId(entity.getId());
        dto.setChatRoomId(entity.getChatRoom().getId());
        dto.setVoiceChannelName(entity.getChannelName());
        dto.setMaxUsers(entity.getMaxUsers());
        return dto;
    }
}