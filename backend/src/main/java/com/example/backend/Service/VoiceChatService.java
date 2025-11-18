package com.example.backend.Service;

import com.example.backend.Dto.VoiceParticipantDto;
import com.example.backend.Repository.UserRepository;
import com.example.backend.Repository.VoiceChannelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VoiceChatService {
    private final SimpMessagingTemplate messagingTemplate;
    private final VoiceChannelRepository voiceChannelRepository;
    private final UserRepository userRepository;

    // 참가자 현황 (Key: userId, Value: VoiceChannelInfo)
    private final Map<String, VoiceChannelInfo> userVoiceChannelMap = new ConcurrentHashMap<>();

    // 음성채널 정보 클래스
    private static class VoiceChannelInfo {
        private String roomId;
        private String voiceChannelId;
        private String userName;

        public VoiceChannelInfo(String roomId, String voiceChannelId, String userName) {
            this.roomId = roomId;
            this.voiceChannelId = voiceChannelId;
            this.userName = userName;
        }

        // getters
        public String getRoomId() { return roomId; }
        public String getVoiceChannelId() { return voiceChannelId; }
        public String getUserName() { return userName; }
    }

    // 유저가 채널 입장
    public void joinChannel(String roomId, String userId, String voiceChannelId) {
        // 사용자 닉네임 조회 (userNickName 우선, 없으면 userName, 둘 다 없으면 userId)
        String displayName = userRepository.findByUserId(userId)
                .map(user -> {
                    if (user.getUserNickName() != null && !user.getUserNickName().trim().isEmpty()) {
                        return user.getUserNickName();
                    }
                    return user.getUserName() != null ? user.getUserName() : userId;
                })
                .orElse(userId); // 사용자를 찾을 수 없으면 userId 사용

        // 참여자 정보 저장
        userVoiceChannelMap.put(userId, new VoiceChannelInfo(roomId, voiceChannelId, displayName));

        // WebSocket으로 브로드캐스트
        broadcast(roomId);
    }

    // 유저가 채널 퇴장
    public void leaveChannel(String roomId, String userId) {

        userVoiceChannelMap.remove(userId);

        // WebSocket으로 브로드캐스트
        broadcast(roomId);
    }

    // 특정 채널 참여자 조회
    public List<VoiceParticipantDto> getParticipants(String roomId) {
        return userVoiceChannelMap.entrySet().stream()
                .filter(e -> e.getValue().getRoomId().equals(roomId))
                .map(e -> {
                    VoiceChannelInfo info = e.getValue();
                    return new VoiceParticipantDto(
                            e.getKey(),
                            info.getUserName(),
                            info.getRoomId(),
                            info.getVoiceChannelId()
                    );
                })
                .collect(Collectors.toList());
    }

    // 특정 음성채널 참여자 조회
    public List<VoiceParticipantDto> getParticipantsByVoiceChannel(String roomId, String voiceChannelId) {
        return userVoiceChannelMap.entrySet().stream()
                .filter(e -> e.getValue().getRoomId().equals(roomId) &&
                        e.getValue().getVoiceChannelId().equals(voiceChannelId))
                .map(e -> {
                    VoiceChannelInfo info = e.getValue();
                    return new VoiceParticipantDto(
                            e.getKey(),
                            info.getUserName(),
                            info.getRoomId(),
                            info.getVoiceChannelId()
                    );
                })
                .collect(Collectors.toList());
    }

    // WebSocket 브로드캐스트 (전역 + 개별 방)
    private void broadcast(String roomId) {
        List<VoiceParticipantDto> participants = getParticipants(roomId);

        // 개별 방 브로드캐스트
        String destination = "/topic/chat/" + roomId + "/voice-participants";
        messagingTemplate.convertAndSend(destination, participants);

        // 전역 브로드캐스트
        String globalDestination = "/topic/voice-participants";
        Map<String, Object> payload = new HashMap<>();
        payload.put("roomId", roomId);
        payload.put("participants", participants);
        messagingTemplate.convertAndSend(globalDestination, payload);
    }
}