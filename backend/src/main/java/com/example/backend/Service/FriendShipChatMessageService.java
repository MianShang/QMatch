package com.example.backend.Service;

import com.example.backend.Dto.Request.FriendChatMessageRequestDto;
import com.example.backend.Dto.Response.FriendChatMessageResponseDto;
import com.example.backend.Entity.FriendShipChatMessage;
import com.example.backend.Entity.FriendShipChatRoom;
import com.example.backend.Entity.FriendShipChatUnRead;
import com.example.backend.Entity.User;
import com.example.backend.Repository.FriendShipChatMessageRepository;
import com.example.backend.Repository.FriendShipChatRoomRepository;
import com.example.backend.Repository.FriendShipChatUnReadRepository;
import com.example.backend.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FriendShipChatMessageService {

    private final FriendShipChatMessageRepository friendShipChatMessageRepository;
    private final FriendShipChatRoomRepository friendShipChatRoomRepository;
    private final FriendShipChatUnReadRepository friendShipChatUnReadRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;


    //메세지 가져오기
    public List<FriendChatMessageResponseDto> getMessages(long roomId)
    {
        return friendShipChatMessageRepository.findByFriendShipChatRoom_IdOrderBySendTimeAsc(roomId)
                .stream()
                .map(msg -> {
                    FriendChatMessageResponseDto dto = new FriendChatMessageResponseDto();
                    dto.setId(msg.getId());
                    dto.setChatroomId(msg.getFriendShipChatRoom().getId());
                    dto.setChatDate(msg.getSendTime());
                    dto.setMessage(msg.getMessage());
                    dto.setName(msg.getUser().getUserId());
                    return dto;
                }).toList();
    }


    //메세지 보내기
    @Transactional
    public FriendChatMessageResponseDto saveMessage(Long roomId, FriendChatMessageRequestDto message)
    {
        FriendShipChatRoom room = friendShipChatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다: " + roomId));

        User user = userRepository.findByUserId(message.getSendId())
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다: " + message.getSendId()));

        FriendShipChatMessage entitySave = new FriendShipChatMessage();
        entitySave.setFriendShipChatRoom(room);
        entitySave.setUser(user);
        entitySave.setMessage(message.getMessage());
        entitySave.setSendTime(LocalDateTime.now());
        FriendShipChatMessage saved = friendShipChatMessageRepository.save(entitySave);

        FriendShipChatUnRead unReadSave = new FriendShipChatUnRead();
        unReadSave.setFriendShipChatRoom(room);
        unReadSave.setMessage(saved);
        unReadSave.setSendId(user.getUserId());
        unReadSave.setReceiveId(message.getReceiveId());
        friendShipChatUnReadRepository.save(unReadSave);



        FriendChatMessageResponseDto dto = new FriendChatMessageResponseDto();
        dto.setId(saved.getId());
        dto.setChatroomId(saved.getFriendShipChatRoom().getId());
        dto.setChatDate(saved.getSendTime());
        dto.setMessage(saved.getMessage());
        dto.setName(saved.getUser().getUserId());
        dto.setUserName(user.getUserName());

        Long unReadCount = friendShipChatUnReadRepository.countByFriendShipChatRoom_IdAndReceiveId(roomId, message.getReceiveId());

        //보낸이 받는이 에게 브로드캐스트
        messagingTemplate.convertAndSend("/topic/friends/chat/" + roomId, dto);

        // 받는 사람에게 안읽은 메시지 개수 업데이트 알림 전송
        messagingTemplate.convertAndSend("/topic/friends/unread/" + message.getReceiveId(),
                Map.of("friendId", message.getSendId(), "unreadCount", unReadCount)
        );
        
        return dto;
    }
}
