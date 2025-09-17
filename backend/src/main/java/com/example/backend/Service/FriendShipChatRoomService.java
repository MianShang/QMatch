package com.example.backend.Service;

import com.example.backend.Entity.FriendShipChatRoom;
import com.example.backend.Repository.FriendShipChatRoomRepository;
import com.example.backend.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FriendShipChatRoomService {

    private final FriendShipChatRoomRepository friendShipChatRoomRepository;
    private final UserRepository userRepository;

    public Long getCreateChatRoom(Long friendShipId)
    {
        Optional<FriendShipChatRoom> chatRoom = friendShipChatRoomRepository.findByFriendShipId(friendShipId);
        return 0
    }

}
