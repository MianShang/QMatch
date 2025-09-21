package com.example.backend.Controller;

import com.example.backend.Dto.Request.UserChatRoomRequestDto;
import com.example.backend.Dto.Request.RoomJoinRequestDto;
import com.example.backend.Dto.Request.RoomJoinResponseDto;
import com.example.backend.Dto.Response.UserResponseDto;
import com.example.backend.Dto.Response.UserChatRoomResponseDto;
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
import com.example.backend.enums.ChatRoomUserStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

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
    public ResponseEntity<List<UserChatRoomResponseDto>> getUserChatRooms(@RequestParam String userId) {

        // 유저 ID가 저장한 채팅방 목록 select
        List<UserChatRoom> userChatRooms = userChatRoomService.getUserChatRooms(userId);

        // DTO로 변환하여 hostUserId 포함
        List<UserChatRoomResponseDto> responseDtos = userChatRooms.stream()
                .map(ucr -> {
                    UserChatRoomResponseDto dto = new UserChatRoomResponseDto();
                    dto.setId(ucr.getId());
                    dto.setChatRoom(ucr.getChatRoom());
                    dto.setRole(ucr.getRole());
                    dto.setStatus(ucr.getStatus());
                    dto.setHostUserId(ucr.getChatRoom().getOwner() != null ? 
                            ucr.getChatRoom().getOwner().getUserId() : null);
                    return dto;
                })
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(responseDtos);
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

    // 채팅방 입장 신청 API
    @PostMapping("/api/chat/rooms/{roomId}/join-request")
    public ResponseEntity<?> requestJoinRoom(
            @PathVariable String roomId,
            @RequestBody RoomJoinRequestDto request) {
        
        try {
            // 1. 채팅방 조회
            ChatRoom room = chatRoomRepository.findById(roomId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));
            
            // 2. 유저 조회
            User user = userRepository.findByUserId(request.getUserId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "유저를 찾을 수 없습니다."));
            
            // 3. 이미 PENDING 상태로 신청했는지 확인
            userChatRoomRepository.findByUser_UserIdAndChatRoom_IdAndStatus(request.getUserId(), roomId, ChatRoomUserStatus.PENDING)
                    .ifPresent(existing -> {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 입장 신청을 했습니다.");
                    });
            
            // 4. 이미 ACCEPTED 상태인지 확인 (이미 승인된 사용자가 다시 신청하는 것 방지)
            userChatRoomRepository.findByUser_UserIdAndChatRoom_IdAndStatus(request.getUserId(), roomId, ChatRoomUserStatus.ACCEPTED)
                    .ifPresent(existing -> {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 채팅방에 참여하고 있습니다.");
                    });
            
            // 5. 입장 신청 생성 (PENDING 상태)
            UserChatRoom joinRequest = new UserChatRoom(user, room, com.example.backend.Entity.Role.MEMBER);
            joinRequest.setStatus(ChatRoomUserStatus.PENDING);
            userChatRoomRepository.save(joinRequest);
            
            // 6. 방장에게 실시간 알림 전송
            // 6-1. 채팅방 전체 알림 (방장이 채팅방에 있을 때)
            simpMessagingTemplate.convertAndSend("/topic/room/" + roomId + "/join-request",
                    Map.of(
                            "type", "join-request",
                            "userId", request.getUserId(),
                            "userName", user.getUserName(),
                            "roomId", roomId,
                            "timestamp", System.currentTimeMillis()
                    ));
            
            // 6-2. 방장에게 개인 알림 (방장이 채팅방에 없어도 받을 수 있음)
            if (room.getOwner() != null) {
                simpMessagingTemplate.convertAndSend("/topic/user/" + room.getOwner().getUserId() + "/join-request",
                        Map.of(
                                "type", "join-request",
                                "userId", request.getUserId(),
                                "userName", user.getUserName(),
                                "roomId", roomId,
                                "roomName", room.getName(),
                                "hostUserId", room.getOwner().getUserId(), // 방장 ID 추가
                                "timestamp", System.currentTimeMillis()
                        ));
            }
            
            return ResponseEntity.ok(new RoomJoinResponseDto(
                    request.getUserId(), 
                    roomId, 
                    ChatRoomUserStatus.PENDING, 
                    "입장 신청이 전송되었습니다. 방장의 승인을 기다려주세요."
            ));
            
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "입장 신청 중 오류가 발생했습니다."));
        }
    }
    
    // 방장이 입장 신청을 승인하는 API
    @PostMapping("/api/chat/rooms/{roomId}/approve-join")
    public ResponseEntity<?> approveJoinRequest(
            @PathVariable String roomId,
            @RequestParam String ownerId,
            @RequestParam String applicantId) {
        
        try {
            // 1. 채팅방 조회 및 방장 권한 확인
            ChatRoom room = chatRoomRepository.findById(roomId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));
            
            if (room.getOwner() == null || !room.getOwner().getUserId().equals(ownerId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "방장만 입장 신청을 승인할 수 있습니다."));
            }
            
            // 2. 입장 신청 조회
            UserChatRoom joinRequest = userChatRoomRepository.findByUser_UserIdAndChatRoom_Id(applicantId, roomId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "입장 신청을 찾을 수 없습니다."));
            
            // 3. 이미 처리된 신청인지 확인
            if (joinRequest.getStatus() != ChatRoomUserStatus.PENDING) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "이미 처리된 신청입니다."));
            }
            
            // 4. 채팅방 정원 확인
            if (room.getCurrentUsers() >= room.getMaxUsers()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "채팅방이 가득 찼습니다."));
            }
            
            // 5. 신청 승인 처리
            joinRequest.setStatus(ChatRoomUserStatus.ACCEPTED);
            userChatRoomRepository.save(joinRequest);
            
            // 6. 채팅방 현재 인원 수 증가
            room.setCurrentUsers(room.getCurrentUsers() + 1);
            chatRoomRepository.save(room);
            
            // 7. 신청자에게 승인 알림 전송
            simpMessagingTemplate.convertAndSend("/topic/user/" + applicantId + "/join-response",
                    Map.of(
                            "type", "join-approved",
                            "roomId", roomId,
                            "roomName", room.getName(),
                            "gameName", room.getGameName() != null ? room.getGameName() : "",
                            "tagNames", room.getChatRoomTags().stream()
                                    .map(ct -> ct.getGameTag() != null ? ct.getGameTag().getTagName() : null)
                                    .filter(Objects::nonNull)
                                    .distinct()
                                    .toList(),
                            "message", "입장이 승인되었습니다!",
                            "timestamp", System.currentTimeMillis()
                    ));
            
            // 8. 실시간 접속 맵에 멤버 추가 (승인된 멤버 즉시 입장)
            RealTimeUserManagement.activeUsersByRoom
                    .putIfAbsent(roomId, java.util.concurrent.ConcurrentHashMap.newKeySet());
            RealTimeUserManagement.activeUsersByRoom.get(roomId).add(applicantId);
            
            // 9. 채팅방 전체에 새 멤버 입장 알림
            simpMessagingTemplate.convertAndSend("/topic/chat/" + roomId + "/member-joined",
                    Map.of(
                            "type", "member-joined",
                            "userId", applicantId,
                            "userName", joinRequest.getUser().getUserName(),
                            "roomId", roomId,
                            "timestamp", System.currentTimeMillis()
                    ));
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "입장 신청을 승인했습니다.",
                    "applicantId", applicantId,
                    "roomId", roomId
            ));
            
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "승인 처리 중 오류가 발생했습니다."));
        }
    }
    
    // 방장이 입장 신청을 거절하는 API
    @PostMapping("/api/chat/rooms/{roomId}/reject-join")
    public ResponseEntity<?> rejectJoinRequest(
            @PathVariable String roomId,
            @RequestParam String ownerId,
            @RequestParam String applicantId) {
        
        try {
            // 1. 채팅방 조회 및 방장 권한 확인
            ChatRoom room = chatRoomRepository.findById(roomId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));
            
            if (room.getOwner() == null || !room.getOwner().getUserId().equals(ownerId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "방장만 입장 신청을 거절할 수 있습니다."));
            }
            
            // 2. 입장 신청 조회
            UserChatRoom joinRequest = userChatRoomRepository.findByUser_UserIdAndChatRoom_Id(applicantId, roomId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "입장 신청을 찾을 수 없습니다."));
            
            // 3. 이미 처리된 신청인지 확인
            if (joinRequest.getStatus() != ChatRoomUserStatus.PENDING) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "이미 처리된 신청입니다."));
            }
            
            // 4. 신청 거절 처리
            joinRequest.setStatus(ChatRoomUserStatus.REJECTED);
            userChatRoomRepository.save(joinRequest);
            
            // 5. UserChatRoom 관계 삭제 (거절된 신청은 DB에서 제거)
            userChatRoomRepository.delete(joinRequest);
            
            // 6. 신청자에게 거절 알림 전송
            simpMessagingTemplate.convertAndSend("/topic/user/" + applicantId + "/join-response",
                    Map.of(
                            "type", "join-rejected",
                            "roomId", roomId,
                            "roomName", room.getName(),
                            "message", "입장 신청이 거절되었습니다",
                            "timestamp", System.currentTimeMillis()
                    ));
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "입장 신청을 거절했습니다.",
                    "applicantId", applicantId,
                    "roomId", roomId
            ));
            
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "거절 처리 중 오류가 발생했습니다."));
        }
    }
    
    // 채팅방의 대기 중인 입장 신청 목록 조회 API (방장용)
    @GetMapping("/api/chat/rooms/{roomId}/pending-requests")
    public ResponseEntity<?> getPendingJoinRequests(
            @PathVariable String roomId,
            @RequestParam String ownerId) {
        
        try {
            // 1. 채팅방 조회 및 방장 권한 확인
            ChatRoom room = chatRoomRepository.findById(roomId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));
            
            if (room.getOwner() == null || !room.getOwner().getUserId().equals(ownerId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "방장만 입장 신청 목록을 조회할 수 있습니다."));
            }
            
            // 2. 대기 중인 입장 신청 목록 조회
            List<UserChatRoom> pendingRequests = userChatRoomRepository
                    .findByChatRoom_IdAndStatus(roomId, ChatRoomUserStatus.PENDING);
            
            List<Map<String, Object>> requestList = pendingRequests.stream()
                    .map(request -> {
                        Map<String, Object> requestMap = new HashMap<>();
                        requestMap.put("userId", request.getUser().getUserId());
                        requestMap.put("userName", request.getUser().getUserName());
                        requestMap.put("requestTime", request.getId()); // 임시로 ID 사용, 실제로는 생성 시간 필드 필요
                        return requestMap;
                    })
                    .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                    "roomId", roomId,
                    "pendingRequests", requestList
            ));
            
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "입장 신청 목록 조회 중 오류가 발생했습니다."));
        }
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
