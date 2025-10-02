package com.example.backend.Controller;

import com.example.backend.Service.FriendInviteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat/rooms")
@RequiredArgsConstructor
public class FriendInviteController {

    private final FriendInviteService friendInviteService;

    // 친구 초대 전송
    @PostMapping("/invite-friend")
    public ResponseEntity<?> inviteFriend(@RequestBody Map<String, Object> request) {
        try {
            String roomId = (String) request.get("roomId");
            String roomName = (String) request.get("roomName");
            String inviterId = (String) request.get("inviterId");
            String inviterName = (String) request.get("inviterName");
            String friendId = (String) request.get("friendId");
            String friendName = (String) request.get("friendName");

            System.out.println("친구 초대 요청 - roomId: " + roomId + ", inviterId: " + inviterId + ", friendId: " + friendId);

            friendInviteService.sendFriendInvite(roomId, roomName, inviterId, inviterName, friendId, friendName);
            
            return ResponseEntity.ok(Map.of("success", true, "message", "친구 초대가 전송되었습니다."));
        } catch (Exception e) {
            System.out.println("친구 초대 오류: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 친구 초대 수락
    @PostMapping("/accept-invite")
    public ResponseEntity<?> acceptInvite(@RequestBody Map<String, Object> request) {
        try {
            String roomId = (String) request.get("roomId");
            String userId = (String) request.get("userId");

            friendInviteService.acceptFriendInvite(roomId, userId);
            
            return ResponseEntity.ok(Map.of("success", true, "message", "초대를 수락했습니다."));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 친구 초대 거절
    @PostMapping("/reject-invite")
    public ResponseEntity<?> rejectInvite(@RequestBody Map<String, Object> request) {
        try {
            String roomId = (String) request.get("roomId");
            String userId = (String) request.get("userId");
            Boolean isAutoReject = (Boolean) request.getOrDefault("isAutoReject", false);

            friendInviteService.rejectFriendInvite(roomId, userId, isAutoReject);
            
            return ResponseEntity.ok(Map.of("success", true, "message", "초대를 거절했습니다."));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
