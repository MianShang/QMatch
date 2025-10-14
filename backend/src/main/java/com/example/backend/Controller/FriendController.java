package com.example.backend.Controller;

import com.example.backend.Dto.Response.FriendShipResponseDto;
import com.example.backend.Service.FriendShipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/friends")
public class FriendController {

    private final FriendShipService friendShipService;

    @PostMapping("/request")
    public ResponseEntity<String> sendFriendRequest(@RequestParam String requesterId, @RequestParam String addresseeId) {
        try {
            friendShipService.sendFriendRequest(requesterId, addresseeId);
            return ResponseEntity.ok("친구 요청이 성공적으로 전송되었습니다.");
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/accept")
    public ResponseEntity<String> acceptFriendRequest(@RequestParam String responseId, @RequestParam String userId) {
        try {
            friendShipService.acceptFriendRequest(responseId, userId);
            return ResponseEntity.ok("친구 요청이 수락되었습니다.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/reject")
    public ResponseEntity<String> rejectFriendRequest(@RequestParam String responseId, @RequestParam String userId) {
        try {
            friendShipService.rejectFriendRequest(responseId, userId);
            return ResponseEntity.ok("친구 요청이 거절되었습니다.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }

    }

    // 친구 목록을 조회하는 새로운 엔드포인트
    @GetMapping("/list")
    public ResponseEntity<List<FriendShipResponseDto>> getFriendsList(@RequestParam String userId) {
        try {
            List<FriendShipResponseDto> friends = friendShipService.getFriendsList(userId);
            return ResponseEntity.ok(friends);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/block")
    public ResponseEntity<String> blockFriendRequest(@RequestParam String requesterId, @RequestParam String blockedId)
    {
        try {
            friendShipService.blockUser(requesterId, blockedId);
            return ResponseEntity.ok(blockedId +" 차단되었습니다.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/inventory")
    public ResponseEntity<List<FriendShipResponseDto>> getUserInventory(@RequestParam String userId, @RequestParam String bottomToggle) {
        try {
            List<FriendShipResponseDto> inventory = friendShipService.getUserInventoryList(userId, bottomToggle);
            return ResponseEntity.ok(inventory);
        }catch (IllegalArgumentException e)
        {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/pending-count")
    public ResponseEntity<Long> getPendingFriendRequestCount(@RequestParam String userId) {
        try {
            long count = friendShipService.getPendingFriendRequestCount(userId);
            return ResponseEntity.ok(count);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(0L);
        }
    }

    @PostMapping("delete")
    public ResponseEntity<String> deleteFriendRequest(@RequestParam String requesterId, @RequestParam String addresseeId)
    {
        try {
            friendShipService.getDeleteFriend(requesterId,addresseeId);
            return ResponseEntity.ok("친구가 삭제되었습니다.");
        }catch (IllegalArgumentException e) {
            ResponseEntity.badRequest().body(e.getMessage());
            return ResponseEntity.badRequest().body("오류가 발생했습니다." + e.getMessage());
        }
    }

}
