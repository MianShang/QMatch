package com.example.backend.Controller;


import com.example.backend.Dto.Request.ChatRoomRequestDto;
import com.example.backend.Entity.*;
import com.example.backend.Repository.*;
import com.example.backend.Service.ChatRoomService;
import com.example.backend.Websocket.RealTimeUserManagement;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.web.bind.annotation.*;
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

    // 실시간 채팅방 접속 유저 목록 (roomId -> Set of userIds)
    private final Map<String, Set<String>> activeUsersByRoom = new ConcurrentHashMap<>();
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

        if (userId != null && roomId != null && activeUsersByRoom.containsKey(roomId)) {
            activeUsersByRoom.get(roomId).remove(userId);
            System.out.println("🔴 유저 퇴장: " + userId + " <- 방: " + roomId);
        }
    }

    // 채팅방별 실시간 접속 유저 조회 API
    @GetMapping("/active-users/{roomId}")
    public Set<String> getActiveUsers(@PathVariable String roomId) {
        return activeUsersByRoom.getOrDefault(roomId, Collections.emptySet());
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
        // 프론트에서 넘어온 채팅방 이름, 게임 이름, 태그 ID 리스트 추출
        String roomName = chatRoomData.getChatName();
        String gameName = chatRoomData.getGameName();
        List<Long> tagIds = chatRoomData.getTags();

        // 생성자를 통해 방 id, 이름 객체 생성
        ChatRoom room = new ChatRoom(UUID.randomUUID().toString(), roomName);
        room.setGameName(gameName);

        // 먼저 방 저장
        ChatRoom savedRoom = chatRoomRepository.save(room);

        // 선택된 태그가 있으면 중간 테이블(ChatRoomTag)에 연결
        if (tagIds != null && !tagIds.isEmpty()) {

            // 태그 ID 목록을 통해 GameTag 엔티티 조회 + 중복 제거
            List<GameTag> tags = gameTagRepository.findAllById(tagIds).stream().distinct().toList();

            // 각 태그에 대해 중복 검사 후 ChatRoomTag 생성
            for (GameTag tag : tags) {
                // 이미 같은 (chatroom_id + tag_id) 조합이 있으면 저장하지 않음 → 중복 방지
                boolean exists = chatRoomTagRepository.existsByChatRoomIdAndGameTagId(savedRoom.getId(), tag.getId());
                if (!exists) {
                    ChatRoomTag crt = new ChatRoomTag();
                    crt.setChatRoom(savedRoom);         // 채팅방 연결
                    crt.setGameTag(tag);                // 태그 연결
                    chatRoomTagRepository.save(crt);    // 중간 테이블에 저장
                }
            }
        }

        // DB 저장
        return chatRoomRepository.save(room);
    }
}

