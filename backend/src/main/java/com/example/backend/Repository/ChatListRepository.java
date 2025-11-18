package com.example.backend.Repository;

import com.example.backend.Entity.ChatList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ChatListRepository extends JpaRepository<ChatList, Long> {

    // 채팅방 아이디로 컬럼 검색
    List<ChatList> findByChatRoom_Id(String chatRoom);
    
    // 채팅방 아이디로 채팅 목록 삭제
    void deleteByChatRoom_Id(String chatRoomId);
    
    // 채팅방에서 고정된 메시지들 찾기
    List<ChatList> findByChatRoomIdAndIsPinnedTrue(String chatRoomId);
    
    // 최근 메시지들 가져오기 (시간순 내림차순)
    List<ChatList> findTop10ByChatRoom_IdOrderByChatDateDesc(String chatRoomId);
    
    // 채팅방의 모든 메시지 고정 해제
    @Modifying
    @Transactional
    @Query("UPDATE ChatList c SET c.isPinned = false WHERE c.chatRoom.id = :roomId")
    void updateAllPinnedToFalse(@Param("roomId") String roomId);
}
