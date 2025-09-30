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
        voiceChannelRepository.deleteById(channelId);
    }

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