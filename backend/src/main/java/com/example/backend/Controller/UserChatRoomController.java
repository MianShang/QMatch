package com.example.backend.Controller;

import com.example.backend.Dto.Request.UserChatRoomRequestDto;
import com.example.backend.Dto.Response.UserResponseDto;
import com.example.backend.Dto.UserChatRoomDto;
import com.example.backend.Dto.UserDto;
import com.example.backend.Entity.ChatRoom;
import com.example.backend.Entity.User;
import com.example.backend.Entity.UserChatRoom;
import com.example.backend.Repository.ChatRoomRepository;
import com.example.backend.Repository.UserChatRoomRepository;
import com.example.backend.Repository.UserRepository;
import com.example.backend.Service.UserChatRoomService;
import com.example.backend.Websocket.RealTimeUserManagement;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class UserChatRoomController {

    private final UserRepository userRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final UserChatRoomRepository userChatRoomRepository;

    private final UserChatRoomService userChatRoomService;
    private final SimpMessagingTemplate simpMessagingTemplate;

    // 유저가 접속한 채팅방 DB 저장 API
    @PostMapping("/api/add/user/chatroom")
    public ResponseEntity<String> addUserChatRoom(@RequestBody UserChatRoomRequestDto userChatRoomDto) {

        try {
            userChatRoomService.saveUserChatRoom(userChatRoomDto);
            return ResponseEntity.ok("저장 성공");

        } catch (RuntimeException e) {

            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 유저가 저장한 채팅방 불러오는 API
    @GetMapping("/api/get/user/chatrooms")
    public ResponseEntity<List<UserChatRoom>> getUserChatRooms(@RequestParam String userId) {

        // 유저 ID가 저장한 채팅방 목록 select
        List<UserChatRoom> userChatRooms = userChatRoomService.getUserChatRooms(userId);

        return ResponseEntity.ok(userChatRooms);
    }

    // 채팅방에 포함된 유저 목록 가져오는 API
    @GetMapping("/api/get/user/chatlist")
    public ResponseEntity<List<UserResponseDto>> getUserChatList(@RequestParam String roomId) {

        List<UserResponseDto> userResponseDtos = userChatRoomService.getChatRoomUsers(roomId);

        return ResponseEntity.ok(userResponseDtos);
    }

    // 유저가 채팅방 나가기
    @DeleteMapping("/api/chat/rooms/{roomId}/leave")
    public ResponseEntity<?> leaveChatRoom(
            @PathVariable String roomId,
            @RequestParam String userId) {

        // 1. 채팅방 조회
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));

        // 2. 방장인지 체크 → 방장은 나가기 불가
        if (room.getOwner() != null && room.getOwner().getUserId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "방장은 방을 나갈 수 없습니다. 방장을 위임하거나 방을 삭제해야 합니다."));
        }

        // 3. 실시간 접속 맵에서 제거
        RealTimeUserManagement.activeUsersByRoom
                .putIfAbsent(roomId, java.util.concurrent.ConcurrentHashMap.newKeySet());
        boolean removed = RealTimeUserManagement.activeUsersByRoom.get(roomId).remove(userId);

        // 4. UserChatRoom 관계 삭제
        userChatRoomRepository.findByUser_UserIdAndChatRoom_Id(userId, roomId)
                .ifPresent(userChatRoomRepository::delete);

        // 5. 채팅방 현재 인원 수 -1
        if (room.getCurrentUsers() > 0) {
            room.setCurrentUsers(room.getCurrentUsers() - 1);
        }
        chatRoomRepository.save(room);

        // 본인이 나갔을 경우에 상대방도 메시지가 뜨도록 수정
        simpMessagingTemplate.convertAndSend("/topic/chat/" + roomId + "/leave",
                Map.of("roomId", roomId, "userId", userId));

        // 6. 성공 응답 반환
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "채팅방에서 나갔습니다.",
                "roomId", roomId,
                "userId", userId
        ));
    }

//    // 유저가 저장한 채팅방 삭제하는 API
//    @PostMapping("/api/user/delete/userchatroom")
//    public void deleteUserChatRoom(@RequestBody Map<String, Long> body) {
//
//        // Axios 요청의 body의 roomId 데이터 get
//        Long roomId = body.get("roomId");
//
//        // 해당 유저가 저장한 채팅방 컬럼을 기본키로 지정하여 삭제한다
//        userChatRoomRepository.deleteById(roomId);
//    }
}
