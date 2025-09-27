package com.example.backend.Controller;

import com.example.backend.Service.FriendShipChatUnReadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/friends/chatroom/unread")
public class FriendChatMessageUnReadController {

    private final FriendShipChatUnReadService friendShipChatUnReadService;
    private final SimpMessagingTemplate messagingTemplate;

    // 방 수신자 안읽은 메시지 개수
    @GetMapping("message/count/{roomId}")
    public Long getMessageCount(@PathVariable Long roomId, @RequestParam String receiveId)
    {
        Long count = friendShipChatUnReadService.getRoomMessageConunt(roomId, receiveId);

        return count;
    }

    //방 수신자 안읽은 메시지 삭제
    @DeleteMapping("/message/{roomId}")
    public ResponseEntity<Void> deleteMessageCount(@PathVariable Long roomId,@RequestParam  String receiveId)
    {
        friendShipChatUnReadService.deleteRoomMessageCount(roomId, receiveId);

        // 개별 친구에게 안읽은 개수 업데이트 알림 발송
        // 채팅방에서 친구 관계를 조회하여 상대방 친구 ID를 찾아야 함
        // 현재는 간단히 전체 친구 목록 갱신 알림으로 대체
        messagingTemplate.convertAndSend("/topic/friends/inventory/" + receiveId, 
            Map.of("type", "unread-updated", "message", "안읽은 메시지가 업데이트되었습니다."));

        return ResponseEntity.ok().build();
    }

    @GetMapping("message/all-count")
    public Map<Long, Long> getMessageAllCount(@RequestParam String receiveId)
    {
        return friendShipChatUnReadService.getAllChatRoomMessagesCount(receiveId);
    }
}
