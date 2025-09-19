package com.example.backend.Repository;

import com.example.backend.Entity.FriendShipChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FriendShipChatMessageRepository extends JpaRepository<FriendShipChatMessage, Long> {

    List<FriendShipChatMessage> findByFriendShipChatRoom_IdOrderBySendTimeAsc(long RoomId);


}
