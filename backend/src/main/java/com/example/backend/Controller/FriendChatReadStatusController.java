package com.example.backend.Controller;

import com.example.backend.Service.FriendShipChatMessageService;
import com.example.backend.Service.FriendShipChatReadStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/friends/chatroom")
@RequiredArgsConstructor
public class FriendChatReadStatusController {

    private final FriendShipChatMessageService friendShipChatMessageService;
    private final FriendShipChatReadStatusService friendShipChatReadStatusService;
    
    
    //읽음
    @PostMapping("/{roomId}/read")
    public ResponseEntity<Void> friendIsRead(@PathVariable Long roomId, @RequestParam String userId, @RequestParam Long lastReadMessageId) {
        friendShipChatReadStatusService.friendIsRead(roomId, userId, lastReadMessageId);
        return ResponseEntity.ok().build();
    }
    
    // 안읽음 갯수 조회
    @GetMapping("/{roomId}/unread-count")
    public ResponseEntity<Long> getUnReadCount(@PathVariable Long roomId, @RequestParam String userId)
    {
        long lastReadMessageId = friendShipChatReadStatusService.getLastReadMessageId(roomId, userId);
        long count = friendShipChatMessageService.countUnreadMessages(roomId,lastReadMessageId);

        return ResponseEntity.ok().body(count);
    }

}
