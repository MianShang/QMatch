package com.example.backend.Repository;

import com.example.backend.Entity.VoiceChannel;
import com.example.backend.Entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VoiceChannelRepository extends JpaRepository<VoiceChannel, Long> {
    List<VoiceChannel> findByChatRoomId(String chatRoom_id);
    List<VoiceChannel> findByChatRoom(ChatRoom chatRoom);
}