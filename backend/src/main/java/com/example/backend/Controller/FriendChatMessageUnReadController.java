package com.example.backend.Controller;

import com.example.backend.Service.FriendShipChatUnReadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/friends/chatroom/unread")
public class FriendChatMessageUnReadController {

    private final FriendShipChatUnReadService friendShipChatUnReadService;

    // 방 수신자 안읽은 메시지 개수
    @GetMapping("message/count/{roomId}")
    public Long getMessageCount(@PathVariable String roomId, @RequestParam String receiveId)
    {
        Long count = friendShipChatUnReadService.getRoomMessageConunt(roomId, receiveId);

        return count;
    }

    //방 수신자 안읽은 메시지 삭제
    @DeleteMapping("/message/{roomId}")
    public ResponseEntity<Void> deleteMessageCount(@PathVariable Long roomId,@RequestParam  String receiveId)
    {
        friendShipChatUnReadService.deleteRoomMessageCount(roomId, receiveId);

        return ResponseEntity.ok().build();
    }

    @GetMapping("message/all-count")
    public Map<Long, Long> getMessageAllCount(@RequestParam String receiveId)
    {
        return friendShipChatUnReadService.getAllChatRoomMessagesCount(receiveId);
    }
}
