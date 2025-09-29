package com.example.backend.Repository;

import com.example.backend.Entity.FriendShipChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FriendShipChatMessageRepository extends JpaRepository<FriendShipChatMessage, Long> {

    List<FriendShipChatMessage> findByFriendShipChatRoom_IdOrderBySendTimeAsc(long RoomId);

    //안읽음 개수 계산
    long countByFriendShipChatRoom_IdAndIdGreaterThan(Long roomId, Long lastReadMessageId);

    //최신 메시지 조회
    FriendShipChatMessage findTop1ByFriendShipChatRoom_IdOrderByIdDesc(Long roomId);

    //카카오톡 처럼 미리보기 조회 임시코드
    List<FriendShipChatMessage> findByFriendShipChatRoom_IdAndIdGreaterThanOrderByIdAsc(Long roomId, Long lastReadMessageId);


}
