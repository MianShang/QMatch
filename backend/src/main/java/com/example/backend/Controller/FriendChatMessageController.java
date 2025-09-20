package com.example.backend.Controller;

import com.example.backend.Dto.Request.FriendChatMessageRequestDto;
import com.example.backend.Dto.Response.FriendChatMessageResponseDto;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.example.backend.Service.FriendShipChatMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/friends/chatroom/")
public class FriendChatMessageController {

    private final FriendShipChatMessageService friendShipChatMessageService;
    private final SimpMessagingTemplate messagingTemplate;

    //메시지 가져오기
    @GetMapping("{roomId}/messages")
    public List<FriendChatMessageResponseDto> getMessages(@PathVariable Long roomId)
    {
        System.out.println("🟢 친구 메시지 가져오기" );
        return friendShipChatMessageService.getMessages(roomId);
    }

    @MessageMapping("/friends/chat/{roomId}")
    public void sendMessage(@DestinationVariable Long roomId, @Payload FriendChatMessageRequestDto message) {
        // 1) DB 저장
        FriendChatMessageResponseDto saved = friendShipChatMessageService.saveMessage(roomId, message);

        // 2) 구독자(두 명)에게 브로드캐스트
        messagingTemplate.convertAndSend("/topic/friends/chat/" + roomId, saved);
    }
}
