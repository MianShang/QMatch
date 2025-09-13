package com.example.backend.Controller;

import com.example.backend.Entity.UserChatRoom;
import com.example.backend.Service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;
    private final SimpMessagingTemplate messagingTemplate;

    // 입장 신청
    @PostMapping("/{roomId}/apply")
    public ResponseEntity<Void> apply(@PathVariable String roomId, @RequestParam String userId) {
        boolean applied = roomService.apply(roomId, userId);

        if (applied) {
            // 방장에게만 알림
            String ownerId = roomService.getOwnerId(roomId);
            messagingTemplate.convertAndSendToUser(ownerId, "/queue/apply",
                    Map.of("userId", userId, "message", userId + " 님이 입장 신청했습니다."));
        }
        return ResponseEntity.ok().build();
    }

    // 방장 수락
    @PostMapping("/{roomId}/accept")
    public ResponseEntity<Void> accept(@PathVariable String roomId, @RequestParam String userId) {
        roomService.accept(roomId, userId);

        // 방 전체에게 알림
        messagingTemplate.convertAndSend("/topic/chat/" + roomId + "/accept",
                Map.of("userId", userId, "message", userId + " 님을 수락했습니다."));

        // 개인 유저에게만 알림
        messagingTemplate.convertAndSendToUser(userId, "/queue/accept",
                Map.of("message", "성공적으로 입장하였습니다"));
        return ResponseEntity.ok().build();
    }

    // 방장 → 대기자 거절
        @PostMapping("/{roomId}/reject-apply")
        public ResponseEntity<Void> rejectApply(@PathVariable String roomId, @RequestParam String userId) {
            roomService.reject(roomId, userId);
            messagingTemplate.convertAndSendToUser(userId, "/queue/reject",
                    Map.of("message", "방장이 입장 요청을 거절했습니다"));
            return ResponseEntity.ok().build();
        }


    // 대기자 목록
    @GetMapping("/{roomId}/pending")
    public ResponseEntity<List<UserChatRoom>> getPending(@PathVariable String roomId) {
        return ResponseEntity.ok(roomService.getPendingUsers(roomId));
    }
}
