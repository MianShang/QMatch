package com.example.backend.Service;

import com.example.backend.Entity.FriendShip;
import com.example.backend.Entity.FriendShipChatRoom;
import com.example.backend.Entity.User;
import com.example.backend.Repository.FriendShipChatRoomRepository;
import com.example.backend.Repository.FriendShipRepository;
import com.example.backend.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FriendShipChatRoomService {

    private final FriendShipChatRoomRepository friendShipChatRoomRepository;
    private final UserRepository userRepository;
    private final FriendShipRepository friendShipRepository;

    public Long getCreateChatRoom(String requesterId, String userId)
    {
        User user = userRepository.findByUserId(userId).orElseThrow(()-> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        User requester = userRepository.findByUserId(requesterId).orElseThrow(()-> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Optional<FriendShip>  friendship = friendShipRepository.findByBothUsers(user.getId(), requester.getId());

        Long friendShipId = friendship.orElseThrow(()->new IllegalArgumentException("친구 관계를 찾을 수 없음")).getId();

        Optional<FriendShipChatRoom> chatRoom = friendShipChatRoomRepository.findByfriendship_Id(friendShipId);

        if(chatRoom.isPresent())
        {
            return chatRoom.get().getId();
        } else
        {

            FriendShipChatRoom friendShipChatRoom = new FriendShipChatRoom(friendship.get());
            friendShipChatRoomRepository.save(friendShipChatRoom);

            return friendShipChatRoom.getId();
        }
    }

}
