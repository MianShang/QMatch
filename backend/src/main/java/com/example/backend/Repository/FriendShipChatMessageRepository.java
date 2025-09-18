package com.example.backend.Repository;

import com.example.backend.Entity.FriendShipChatMessage;
import com.example.backend.Entity.FriendShipChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FriendShipChatMessageRepository extends JpaRepository<FriendShipChatMessage, Long> {

    List<FriendShipChatMessage> findByFriendShipChatRoomOrderBySendTimeAsc(FriendShipChatRoom chatRoom);


}
