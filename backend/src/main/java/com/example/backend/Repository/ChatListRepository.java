package com.example.backend.Repository;

import com.example.backend.Entity.ChatList;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatListRepository extends JpaRepository<ChatList, Long> {

    // 채팅방 아이디로 컬럼 검색
    List<ChatList> findByChatRoom_Id(String chatRoom);
    
    // 채팅방 아이디로 채팅 목록 삭제
    void deleteByChatRoom_Id(String chatRoomId);
    
    // 채팅방에서 고정된 메시지들 찾기
    List<ChatList> findByChatRoomIdAndIsPinnedTrue(String chatRoomId);
}
