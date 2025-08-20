package com.example.backend.Repository;

import com.example.backend.Entity.ChatRoomTag;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatRoomTagRepository extends JpaRepository<ChatRoomTag, Long> {
    boolean existsByChatRoomIdAndGameTagId(String chatRoomId, Long tagId);
}
