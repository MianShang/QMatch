package com.example.backend.Repository;

import com.example.backend.Entity.FriendShipChatUnRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FriendShipChatUnReadRepository extends JpaRepository<FriendShipChatUnRead, Long> {
    
    
    // 방 + 수신자 전체 안읽은 메시지 수
    Long countByFriendShipChatRoom_IdAndReceiveId(Long id, String receiveId);

    // 방 + 수신자 안읽은 메시지 전체 삭제
    void deleteByFriendShipChatRoom_IdAndReceiveId(Long id, String receiveId);

    //전체 방 안읽은 메시지 수
    @Query("SELECT u.friendShipChatRoom.id, COUNT(u) " +
            "FROM FriendShipChatUnRead u " +
            "WHERE u.receiveId = :receiveId " +
            "GROUP BY u.friendShipChatRoom.id")
    List<Object[]> countAllUnreadByReceiveId(@Param("receiveId") String receiveId);



}
