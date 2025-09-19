package com.example.backend.Service;

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
import java.util.stream.Collectors;

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
                    dto.setSendtime(msg.getSendTime());
                    dto.setContent(msg.getContent());
                    dto.setUserid(msg.getUser().getId());
                    return dto;
                }).toList();
    }
    
    
    //메세지 보내기
    public FriendShipChatMessage send(Long roomId, Long senderId, String content)
    {
        FriendShipChatRoom room = friendShipChatRoomRepository.findById(roomId).orElse(null);
        User sender = userRepository.findById(senderId).orElse(null);

        FriendShipChatMessage message = new FriendShipChatMessage();
        message.setFriendShipChatRoom(room);
        message.setUser(sender);
        message.setContent(content);
        message.setSendTime(LocalDateTime.now());

        return friendShipChatMessageRepository.save(message);
    }
}
