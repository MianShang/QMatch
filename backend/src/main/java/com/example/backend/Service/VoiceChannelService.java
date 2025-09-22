package com.example.backend.Service;

import com.example.backend.Dto.VoiceChannelDto;
import com.example.backend.Entity.ChatRoom;
import com.example.backend.Entity.VoiceChannel;
import com.example.backend.Repository.ChatRoomRepository;
import com.example.backend.Repository.VoiceChannelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VoiceChannelService {
    private final VoiceChannelRepository voiceChannelRepository;
    private final ChatRoomRepository chatRoomRepository;

    public List<VoiceChannelDto> getVoiceChannelsByChatRoom(String chatRoomId) {
        return voiceChannelRepository.findByChatRoomId(chatRoomId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public VoiceChannelDto createVoiceChannel(VoiceChannelDto dto) {
        Optional<ChatRoom> chatRoomOpt = chatRoomRepository.findById(dto.getChatRoomId());
        if (chatRoomOpt.isEmpty()) return null;

        VoiceChannel vc = new VoiceChannel();
        vc.setChatRoom(chatRoomOpt.get());
        vc.setChannelName(dto.getVoiceChannelName());
        vc.setMaxUsers(dto.getMaxUsers() != null ? dto.getMaxUsers() : null);


        return toDTO(voiceChannelRepository.save(vc));
    }

    public boolean deleteVoiceChannel(Long id) {
        if (!voiceChannelRepository.existsById(id)) return false;
        voiceChannelRepository.deleteById(id);
        return true;
    }

    private VoiceChannelDto toDTO(VoiceChannel vc) {
        VoiceChannelDto dto = new VoiceChannelDto();
        dto.setId(vc.getId());
        dto.setChatRoomId(vc.getChatRoom().getId());
        dto.setVoiceChannelName(vc.getChannelName());
        dto.setMaxUsers(vc.getMaxUsers());
        return dto;
    }
}
