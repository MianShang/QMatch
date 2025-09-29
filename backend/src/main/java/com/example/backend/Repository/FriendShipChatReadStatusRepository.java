package com.example.backend.Repository;

import com.example.backend.Entity.FriendShipChatReadStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FriendShipChatReadStatusRepository extends JpaRepository<FriendShipChatReadStatus, Long> {

    //특정 사용자 안읽은 메시지 id값
    List<FriendShipChatReadStatus> findByFriendShipChatRoom_IdAndUserId(Long roomId, String userId);

}
