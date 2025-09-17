package com.example.backend.Repository;


import com.example.backend.Entity.FriendShipChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FriendShipChatRoomRepository extends JpaRepository<FriendShipChatRoom, Integer> {
    
    //friendShip Id로 ChatRoom검색
    Optional<FriendShipChatRoom> findByFriendShipId(long friendShipId);
}
