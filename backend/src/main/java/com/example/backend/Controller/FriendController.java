package com.example.backend.Controller;

import com.example.backend.Dto.UserDto;
import com.example.backend.Service.FriendShipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
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

    @PutMapping("/accept")
    public ResponseEntity<String> acceptFriendRequest(@RequestParam String requesterId, @RequestParam String addresseeId) {
        try {
            friendShipService.acceptFriendRequest(requesterId, addresseeId);
            return ResponseEntity.ok("친구 요청이 수락되었습니다.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/reject")
    public ResponseEntity<String> rejectFriendRequest(@RequestParam String requesterId, @RequestParam String addresseeId) {
        try {
            friendShipService.rejectFriendRequest(requesterId, addresseeId);
            return ResponseEntity.ok("친구 요청이 거절되었습니다.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 친구 목록을 조회하는 새로운 엔드포인트
    @GetMapping("/list")
    public ResponseEntity<List<UserDto>> getFriendsList(@RequestParam String userId) {
        try {
            List<UserDto> friends = friendShipService.getFriendsList(userId);
            return ResponseEntity.ok(friends);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.emptyList());
        }
    }



}
