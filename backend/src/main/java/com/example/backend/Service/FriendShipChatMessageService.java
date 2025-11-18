package com.example.backend.Service;

import com.example.backend.Dto.Request.FriendChatMessageRequestDto;
import com.example.backend.Dto.Response.FriendChatMessageResponseDto;
import com.example.backend.Entity.FriendShipChatMessage;
import com.example.backend.Entity.FriendShipChatRoom;
import com.example.backend.Entity.User;
import com.example.backend.Repository.FriendShipChatMessageRepository;
import com.example.backend.Repository.FriendShipChatRoomRepository;
import com.example.backend.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FriendShipChatMessageService {

    private final FriendShipChatMessageRepository friendShipChatMessageRepository;
    private final FriendShipChatRoomRepository friendShipChatRoomRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final FriendShipChatReadStatusService friendShipChatReadStatusService;


    //메세지 가져오기
    public List<FriendChatMessageResponseDto> getMessages(long roomId)
    {
        return friendShipChatMessageRepository.findByFriendShipChatRoom_IdOrderBySendTimeAsc(roomId)
                .stream()
                .map(FriendChatMessageResponseDto::new)
                .toList();
    }


    //메세지 보내기
    @Transactional
    public FriendChatMessageResponseDto saveMessage(Long roomId, FriendChatMessageRequestDto message)
    {
        FriendShipChatRoom room = friendShipChatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다: " + roomId));

        User user = userRepository.findByUserId(message.getSendId())
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다: " + message.getSendId()));


        //메시지 저장
        FriendShipChatMessage entitySave = new FriendShipChatMessage();
        entitySave.setFriendShipChatRoom(room);
        entitySave.setUser(user);
        entitySave.setMessage(message.getMessage());
        entitySave.setSendTime(LocalDateTime.now());
        entitySave.setIsPinned(false); // 새 메시지는 기본적으로 고정되지 않음
        FriendShipChatMessage saved = friendShipChatMessageRepository.save(entitySave);

        // 응답 DTO
        FriendChatMessageResponseDto dto = new FriendChatMessageResponseDto(saved);

        // 브로드캐스트: 채팅방 참여자에게 메시지 전달
        messagingTemplate.convertAndSend("/topic/friends/chat/" + roomId, dto);

        // 받는 사람 unreadCount 계산
        long lastReadId = friendShipChatReadStatusService.getLastReadMessageId(roomId, message.getReceiveId());
        long unreadCount = friendShipChatMessageRepository
                .countByFriendShipChatRoom_IdAndIdGreaterThan(roomId, lastReadId);

        // 받는 사람에게 안읽은 개수 알림
        messagingTemplate.convertAndSend(
                "/topic/friends/unread/" + message.getReceiveId(),
                Map.of("friendId", message.getSendId(), "unreadCount", unreadCount)
        );

        return dto;
    }
    
    
    //안읽은 메시지 카운트
    @Transactional(readOnly = true)
    public long countUnreadMessages(Long roomId, Long lastReadMessageId) {
        return friendShipChatMessageRepository
                .countByFriendShipChatRoom_IdAndIdGreaterThan(roomId, lastReadMessageId);
    }
    
    //메시지 고정/해제
    @Transactional
    public FriendChatMessageResponseDto togglePinMessage(Long messageId, Long roomId) {
        FriendShipChatMessage message = friendShipChatMessageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("메시지를 찾을 수 없습니다: " + messageId));
        
        // 같은 채팅방의 메시지인지 확인
        if (message.getFriendShipChatRoom().getId() != roomId) {
            throw new IllegalArgumentException("해당 채팅방의 메시지가 아닙니다.");
        }
        
        // 현재 메시지가 이미 고정되어 있다면 해제
        if (message.getIsPinned()) {
            message.setIsPinned(false);
        } else {
            // 다른 메시지가 고정되어 있다면 해제
            List<FriendShipChatMessage> pinnedMessages = friendShipChatMessageRepository.findByFriendShipChatRoomIdAndIsPinnedTrue(roomId);
            for (FriendShipChatMessage pinnedMessage : pinnedMessages) {
                pinnedMessage.setIsPinned(false);
                friendShipChatMessageRepository.save(pinnedMessage);
            }
            
            // 현재 메시지 고정
            message.setIsPinned(true);
        }
        
        FriendShipChatMessage saved = friendShipChatMessageRepository.save(message);
        
        // 응답 DTO 생성
        FriendChatMessageResponseDto dto = new FriendChatMessageResponseDto(saved);
        
        // 브로드캐스트: 채팅방 참여자에게 메시지 고정 상태 변경 알림
        messagingTemplate.convertAndSend("/topic/friends/chat/" + roomId, dto);
        
        return dto;
    }
    
    //메시지 삭제
    @Transactional
    public FriendChatMessageResponseDto deleteMessage(Long messageId, Long roomId, String userId) {
        FriendShipChatMessage message = friendShipChatMessageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("메시지를 찾을 수 없습니다: " + messageId));
        
        // 같은 채팅방의 메시지인지 확인
        if (message.getFriendShipChatRoom().getId() != roomId) {
            throw new IllegalArgumentException("해당 채팅방의 메시지가 아닙니다.");
        }
        
        // 본인이 보낸 메시지인지 확인
        if (message.getUser() == null || !message.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인이 보낸 메시지만 삭제할 수 있습니다.");
        }
        
        // 메시지 내용을 "삭제된 메시지입니다"로 변경하고 실제 삭제하지 않음
        message.setMessage("삭제된 메시지입니다");
        // 사용자 정보는 보존 (FriendShipChatMessage는 User 엔티티를 통해 사용자 정보 관리)
        FriendShipChatMessage saved = friendShipChatMessageRepository.save(message);
        
        // 응답 DTO 생성
        FriendChatMessageResponseDto dto = new FriendChatMessageResponseDto(saved);
        
        // 브로드캐스트: 채팅방 참여자에게 메시지 삭제 알림
        Map<String, Object> result = new HashMap<>();
        result.put("type", "friend-message-deleted");
        result.put("messageId", messageId);
        result.put("roomId", roomId);
        result.put("deletedBy", userId);
        
        messagingTemplate.convertAndSend("/topic/friends/chat/" + roomId, result);
        
        return dto;
    }
}
