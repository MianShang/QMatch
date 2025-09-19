package com.example.backend.Repository;

import com.example.backend.Entity.ChatRoomTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface ChatRoomTagRepository extends JpaRepository<ChatRoomTag, Long> {
    boolean existsByChatRoomIdAndGameTagId(String chatRoomId, Long tagId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM ChatRoomTag crt WHERE crt.chatRoom.id = :roomId")
    void deleteByChatRoom_Id(@Param("roomId") String roomId);
}
