package com.example.backend.Controller;

import com.example.backend.Service.VoiceChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class VoiceChatController {
    private final VoiceChatService voiceChatService;

    // STOMP: 유저 입장
    @MessageMapping("/voice/{roomId}/join")
    public void joinChannel(@DestinationVariable String roomId, @Payload Map<String, Object> payload) {

        String userId = (String) payload.get("userId");

        Object voiceChannelIdObj = payload.get("voiceChannelId");
        String voiceChannelId = voiceChannelIdObj != null ? voiceChannelIdObj.toString() : null;

        voiceChatService.joinChannel(roomId, userId, voiceChannelId);
    }

    // STOMP: 유저 퇴장
    @MessageMapping("/voice/{roomId}/leave")
    public void leaveChannel(@DestinationVariable String roomId, @Payload Map<String, Object> payload) {
        String userId = (String) payload.get("userId");

        voiceChatService.leaveChannel(roomId, userId);
    }
}