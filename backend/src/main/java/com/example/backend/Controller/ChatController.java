package com.example.backend.Controller;


import com.example.backend.Dto.Request.ChatRoomRequestDto;
import com.example.backend.Entity.*;
import com.example.backend.Repository.*;
import com.example.backend.Service.ChatRoomService;
import com.example.backend.Websocket.RealTimeUserManagement;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.context.event.EventListener;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;


@RestController // REST API도 처리
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    private final ChatListRepository chatListRepository;
    private final UserChatRoomRepository userChatRoomRepository;
    private final GameTagRepository gameTagRepository;
    private final UserRepository userRepository;

    // 실시간 채팅방 접속 유저 목록 (roomId -> Set of userIds)
//    private final Map<String, Set<String>> activeUsersByRoom = new ConcurrentHashMap<>();
    @Autowired
    private ChatRoomTagRepository chatRoomTagRepository;
    @Autowired
    private ChatRoomService chatRoomService;

    // 구독된 채팅방에 메세지 보내는 API
    @MessageMapping("/chat/{roomId}")
    @SendTo("/topic/chat/{roomId}")
    public Map<String, String> sendMessage(@DestinationVariable String roomId, @Payload Map<String, String> payload) {

        String name = payload.get("name");
        String message = payload.get("message");

        // 메세지가 전송된 채팅방의 ID로 그 방을 저장한 유저 목록을 리스트에 담음
        List<UserChatRoom> userChatRooms = userChatRoomRepository.findByChatRoom_Id(roomId);

        // 해당 방을 저장한 유저들에게 전부 신호 전송
        // simpMessagingTemplate 사용
        for (UserChatRoom userChatRoom : userChatRooms) {

            // User ID만 가져오기
            String userId = userChatRoom.getUser().getUserId();

            // 메세지를 보낸 사람을 제외하고 메세지를 보냄
            if (!userId.equals(name)) {
                simpMessagingTemplate.convertAndSend("/topic/chat/summary/" + userId,
                        // 채팅방 아이디와 메세지 내용을 보냄
                        Map.of("chatRoomId", roomId, "lastMessage", message));
            }
        }

        // 메세지로 유저 ID, 메세지 내용 보냄
        return Map.of("name", name, "message", message);
    }

    // STOMP WebSocket 연결 시 유저 등록
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());

        String userId = accessor.getFirstNativeHeader("userId");
        String roomId = accessor.getFirstNativeHeader("roomId");

        if (userId != null && roomId != null) {

            // 전역 유저 관리 Map 사용
            RealTimeUserManagement.activeUsersByRoom.putIfAbsent(roomId, ConcurrentHashMap.newKeySet());
            RealTimeUserManagement.activeUsersByRoom.get(roomId).add(userId);

            System.out.println("🟢 유저 입장: " + userId + "  방 ID : " + roomId);

            System.out.println("실시간 해당 채팅방 유저 목록");
            System.out.println(RealTimeUserManagement.activeUsersByRoom.getOrDefault(roomId, Set.of()));
        }
    }

    // STOMP WebSocket 연결해제 시 유저 삭제
    @MessageMapping("/disconnect")
    public void handleManualDisconnect(@Payload Map<String, String> payload) {

        String userId = payload.get("userId");
        String roomId = payload.get("roomId");

        if (userId != null && roomId != null) {

            // HashMap에서 삭제
            RealTimeUserManagement.activeUsersByRoom.getOrDefault(roomId, new HashSet<>()).remove(userId);

            System.out.println("🔴 유저 퇴장: " + userId + "  방 ID : " + roomId);

            System.out.println("실시간 해당 채팅방 유저 목록");
            System.out.println(RealTimeUserManagement.activeUsersByRoom.getOrDefault(roomId, Set.of()));
        }
    }

    // STOMP WebSocket 연결 종료 시 유저 제거
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {

        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());

        String userId = accessor.getFirstNativeHeader("userId");
        String roomId = accessor.getFirstNativeHeader("roomId");

        if (userId != null && roomId != null && RealTimeUserManagement.activeUsersByRoom.containsKey(roomId)) {
            RealTimeUserManagement.activeUsersByRoom.get(roomId).remove(userId);
            System.out.println("🔴 유저 퇴장: " + userId + " <- 방: " + roomId);
        }
    }

    // 채팅방별 실시간 접속 유저 조회 API
    @GetMapping("/active-users/{roomId}")
    public Set<String> getActiveUsers(@PathVariable String roomId) {
        return RealTimeUserManagement.activeUsersByRoom.getOrDefault(roomId, Collections.emptySet());
    }

    // 채팅방 전체 조회 API
    @GetMapping("/rooms")
    public List<ChatRoom> getChatRooms(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, name = "tags") List<Long> tags, // 프론트가 문자열이면 유지
            @RequestParam(required = false, name = "gametag") String gametag
    ) {
        // 1) 키워드
        if (keyword != null && !keyword.isBlank() && gametag.equals("ALL")) {
            return chatRoomRepository.findByNameContainingIgnoreCase(keyword);
        }
        else if ((keyword != null && !keyword.isBlank()) && tags == null) {
            return chatRoomService.findByGameAndKeyword(gametag, keyword);
        }
        else if ((keyword != null && !keyword.isBlank()) && (tags != null && !tags.isEmpty())) {
            return chatRoomService.findByKeywordAndGameAndTag(tags, gametag, keyword);
        }
        // 2) 태그
        else if (tags != null  && !tags.isEmpty()) {
            return chatRoomService.findByGameAndTag(tags, gametag);
        }
        else if(tags == null && !gametag.equals("ALL")) {
            return chatRoomService.findByGameName(gametag);
        }
        // 3) 전체
        return chatRoomRepository.findAll();
    }


    // 채팅방 생성
    @PostMapping("/rooms")
    public ChatRoom createRoom(@RequestBody ChatRoomRequestDto chatRoomData) {
        String roomName = chatRoomData.getChatName();
        String gameName = chatRoomData.getGameName();
        List<Long> tagIds = chatRoomData.getTags();
        String creatorUserId = chatRoomData.getCreatorUserId();

        int maxUsers = chatRoomData.getMaxUsers();

        if (maxUsers < 2 || maxUsers > 20) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "방 인원은 2~20명 사이여야 합니다.");
        }

        // (1) 생성자 유효성 검사 (400 반환)
        User creator = userRepository.findByUserId(creatorUserId)
                .orElseThrow(() ->
                        new org.springframework.web.server.ResponseStatusException(
                                org.springframework.http.HttpStatus.BAD_REQUEST,
                                "Unknown creatorUserId: " + creatorUserId
                        )
                );

        // (2) 방 생성 + owner 설정
        ChatRoom room = new ChatRoom(UUID.randomUUID().toString(), roomName, maxUsers, creator);
        room.setGameName(gameName);
        room.setOwner(creator);
        room.setMaxUsers(chatRoomData.getMaxUsers());
        room.setCurrentUsers(1);

        // (3) 저장
        ChatRoom savedRoom = chatRoomRepository.save(room);

        // (4) 참여자 관리용 엔티티도 저장 (방장 HOST)
        UserChatRoom ucr = new UserChatRoom(creator, savedRoom, Role.HOST);
        userChatRoomRepository.save(ucr);

        // (5) 태그 연결
        if (tagIds != null && !tagIds.isEmpty()) {
            List<GameTag> tags = gameTagRepository.findAllById(tagIds).stream().distinct().toList();
            for (GameTag tag : tags) {
                boolean exists = chatRoomTagRepository.existsByChatRoomIdAndGameTagId(savedRoom.getId(), tag.getId());
                if (!exists) {
                    ChatRoomTag crt = new ChatRoomTag();
                    crt.setChatRoom(savedRoom);
                    crt.setGameTag(tag);
                    chatRoomTagRepository.save(crt);
                }
            }
        }

        // (6) 중복 save 제거: 이미 저장한 savedRoom 반환
        return savedRoom;
    }


    @GetMapping("/rooms/{id}")
    public ResponseEntity<?> getRoom(@PathVariable String id) {
        return chatRoomRepository.findDetailById(id).map(cr -> {
            // 태그 문자열 배열 만들어서 같이 내려주고 싶으면 DTO로 변환 (간단 DTO)
                    var tagNames = cr.getChatRoomTags().stream()
                            .map(ct -> ct.getGameTag() != null ? ct.getGameTag().getTagName() : null)
                            .filter(Objects::nonNull)
                            .distinct()
                            .toList();

            String hostName = (cr.getOwner() != null)
                    ? cr.getOwner().getUserName()
                    : "알 수 없음";

                    Map<String, Object> dto = new HashMap<>();
                    dto.put("id", cr.getId());
                    dto.put("name", cr.getName());
                    dto.put("gameName", cr.getGameName());
                    dto.put("tagNames", tagNames);
                    dto.put("hostName", hostName);
                    dto.put("hostUserId", cr.getOwner() != null ? cr.getOwner().getUserId() : null);

                    return ResponseEntity.ok(dto);
                }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // 채팅방 삭제
    @DeleteMapping("/rooms/{roomId}")
    @Transactional
    public ResponseEntity<?> deleteRoom(@PathVariable String roomId,
                                        @RequestParam String requesterUserId) {

        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));

        // 방장이 맞는지 확인
        if (room.getOwner() == null || !room.getOwner().getUserId().equals(requesterUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "방장만 방을 삭제할 수 있습니다."));
        }

        // 인원이 방장 혼자인지 확인
        if (room.getCurrentUsers() > 1) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    Map.of("error", "아직 다른 인원이 있습니다. 방장은 혼자일 때만 삭제할 수 있습니다.")
            );
        }

        // 채팅방과 연결된 UserChatRoom 관계 삭제
        userChatRoomRepository.deleteByChatRoom_Id(roomId);
        chatRoomRepository.delete(room);

        return ResponseEntity.ok(Map.of("success", true, "message", "방이 삭제되었습니다."));
    }

    // 방에서 특정 유저 강퇴
    @PostMapping("/rooms/{roomId}/kick")
    @Transactional
    public ResponseEntity<?> kickUser(@PathVariable String roomId,
                                      @RequestBody Map<String, String> body) {
        String targetUserId = body.get("targetUserId");
        String requesterUserId = body.get("requesterUserId");

        if (targetUserId == null || targetUserId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "targetUserId is required"));
        }

        var roomOpt = chatRoomRepository.findById(roomId);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "room not found"));
        }
        ChatRoom room = roomOpt.get();
        String ownerId = room.getOwner() != null ? room.getOwner().getUserId() : null;
        if (ownerId == null || requesterUserId == null || !ownerId.equals(requesterUserId)) {
            return ResponseEntity.status(403).body(Map.of("error", "no permission"));
        }

        // 실시간 맵에서 제거
        RealTimeUserManagement.activeUsersByRoom
                .putIfAbsent(roomId, java.util.concurrent.ConcurrentHashMap.newKeySet());
        boolean removed = RealTimeUserManagement.activeUsersByRoom.get(roomId).remove(targetUserId);

        long deletedRows = userChatRoomRepository.deleteByUser_UserIdAndChatRoom_Id(targetUserId, roomId);

        userChatRoomRepository.flush();

        simpMessagingTemplate.convertAndSend("/topic/chat/" + roomId + "/kick",
                Map.of("targetUserId", targetUserId, "roomId", roomId, "removed", removed));

        room.setCurrentUsers(room.getCurrentUsers() - 1);

        chatRoomRepository.save(room);

        return ResponseEntity.ok(Map.of("kicked", removed, "deletedRows", deletedRows));
    }

    // 이미 참여되어 있는지 확인
    @PostMapping("/rooms/{roomId}/join")
    @Transactional
    public ResponseEntity<?> joinRoom(
            @PathVariable String roomId,
            @RequestBody Map<String, String> body
    ) {
        String userId = body.get("userId");
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId is required"));
        }

        // 유저, 방 조회
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "user not found"));

        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "room not found"));

        // 이미 참여 중인지 확인
        boolean exists = userChatRoomRepository.existsByUser_UserIdAndChatRoom_Id(userId, roomId);
        if (exists) {
            return ResponseEntity.status(409).body(Map.of("error", "already joined"));
        }

        // 새로 참여 엔티티 저장
        UserChatRoom ucr = new UserChatRoom(user, room, Role.MEMBER);
        room.setCurrentUsers(room.getCurrentUsers() + 1);
        userChatRoomRepository.save(ucr);

        return ResponseEntity.ok(Map.of(
                "message", "joined successfully",
                "roomId", roomId,
                "userId", userId
        ));
    }

    // 방장 변경
    @PostMapping("/rooms/{roomId}/transfer")
    @Transactional
    public ResponseEntity<?> transferHost(
            @PathVariable String roomId,
            @RequestBody Map<String, String> body
    ) {
        String fromUserId = body.get("fromUserId");
        String toUserId = body.get("toUserId");

        if (fromUserId == null || toUserId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "fromUserId, toUserId are required"));
        }

        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.NOT_FOUND, "room not found"));

        // 현재 방장 확인
        if (room.getOwner() == null || !room.getOwner().getUserId().equals(fromUserId)) {
            return ResponseEntity.status(403).body(Map.of("error", "not current host"));
        }

        // 두 유저의 참여 엔티티 찾기
        UserChatRoom fromUcr = userChatRoomRepository.findByUser_UserIdAndChatRoom_Id(fromUserId, roomId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.NOT_FOUND, "fromUser not in room"));

        UserChatRoom toUcr = userChatRoomRepository.findByUser_UserIdAndChatRoom_Id(toUserId, roomId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.NOT_FOUND, "toUser not in room"));

        // Role 교체
        fromUcr.setRole(Role.MEMBER);
        toUcr.setRole(Role.HOST);

        // ChatRoom.owner 갱신
        room.setOwner(toUcr.getUser());

        // 방 전체에 "host 변경됨" 브로드캐스트
        simpMessagingTemplate.convertAndSend(
                "/topic/chat/" + roomId + "/host-transfer",
                Map.of("newHost", toUserId, "oldHost", fromUserId, "roomId", roomId)
        );

        return ResponseEntity.ok(Map.of(
                "message", "host transferred",
                "newHost", toUserId
        ));
    }
}

