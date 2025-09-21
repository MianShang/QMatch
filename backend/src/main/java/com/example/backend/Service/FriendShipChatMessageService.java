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
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FriendShipChatMessageService {

    private final FriendShipChatMessageRepository friendShipChatMessageRepository;
    private final FriendShipChatRoomRepository friendShipChatRoomRepository;
    private final UserRepository userRepository;


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

        FriendChatMessageResponseDto dto = new FriendChatMessageResponseDto();
        dto.setId(saved.getId());
        dto.setChatroomId(saved.getFriendShipChatRoom().getId());
        dto.setChatDate(saved.getSendTime());
        dto.setMessage(saved.getMessage());
        dto.setName(saved.getUser().getUserId());
        dto.setUserName(user.getUserName());

        return dto;
    }
}
