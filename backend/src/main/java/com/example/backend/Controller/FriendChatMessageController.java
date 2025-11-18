package com.example.backend.Controller;

import com.example.backend.Dto.Request.FriendChatMessageRequestDto;
import com.example.backend.Dto.Response.FriendChatMessageResponseDto;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.example.backend.Service.FriendShipChatMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

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
    
    //메시지 고정/해제
    @PutMapping("{roomId}/messages/{messageId}/pin")
    public FriendChatMessageResponseDto togglePinMessage(@PathVariable Long roomId, @PathVariable Long messageId) {
        System.out.println("🟢 메시지 고정/해제: " + messageId);
        return friendShipChatMessageService.togglePinMessage(messageId, roomId);
    }
    
    //메시지 삭제
    @DeleteMapping("{roomId}/messages/{messageId}")
    public ResponseEntity<?> deleteMessage(@PathVariable Long roomId, @PathVariable Long messageId, @RequestParam String userId) {
        try {
            System.out.println("🟢 친구 메시지 삭제: " + messageId + " in room: " + roomId + " by user: " + userId);
            FriendChatMessageResponseDto result = friendShipChatMessageService.deleteMessage(messageId, roomId, userId);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            System.err.println("친구 메시지 삭제 실패: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            System.err.println("친구 메시지 삭제 오류: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "서버 오류가 발생했습니다."));
        }
    }
}
