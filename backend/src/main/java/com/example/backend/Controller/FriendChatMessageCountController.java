package com.example.backend.Controller;

import com.example.backend.Service.FriendShipChatUnReadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/friends/chatroom/unread")
public class FriendChatMessageCountController {

    private final FriendShipChatUnReadService friendShipChatUnReadService;

    // 방 수신자 안읽은 메시지 개수
    @GetMapping("message/count")
    public Long getMessageCount(@RequestParam Long id, @RequestParam String receiveId)
    {
        Long count = friendShipChatUnReadService.getRoomMessageConunt(id, receiveId);

        return count;
    }

    //방 수신자 안읽은 메시지 삭제
    @DeleteMapping("/message")
    public ResponseEntity<Void> deleteMessageCount(@RequestParam Long id, @RequestParam String receiveId)
    {
        friendShipChatUnReadService.deleteRoomMessageCouunt(id, receiveId);

        return ResponseEntity.ok().build();
    }

    @GetMapping("message/all-count")
    public Map<Long, Long> getMessageAllCount(@RequestParam String receiveId)
    {
        return friendShipChatUnReadService.getAllChatRoomMessagesCount(receiveId);
    }
}
