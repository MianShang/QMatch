package com.example.backend.Service;

import com.example.backend.Entity.ChatRoom;
import com.example.backend.Repository.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatRoomService {

    private final ChatRoomRepository chatRoomRepository;

    // 전체 채팅방 조회
    public List<ChatRoom> findAll() {
        return chatRoomRepository.findAll();
    }

    // 키워드 검색
    public List<ChatRoom> findByKeyword(String keyword) {
        return chatRoomRepository.findByNameContainingIgnoreCase(keyword);
    }


    // 채팅방 Tag 조회
    public List<ChatRoom> findByGameAndTag(List<Long> tagIds, String gametag)
    {
        return chatRoomRepository.findByGameAndTagIdsIn(tagIds, gametag);
    }

    public List<ChatRoom> findByGameName(String gameName) {
        return chatRoomRepository.findByGameName(gameName);
    }

    public List<ChatRoom> findByKeywordAndGameAndTag(List<Long> tagIds, String gametag, String keyword)
    {
        return chatRoomRepository.findByGameAndKeywordAndTagIdsIn(tagIds, gametag, keyword);
    }

    public List<ChatRoom> findByGameAndKeyword(String gametag, String keyword)
    {
        return chatRoomRepository.findByGameAndKeyword(gametag, keyword);
    }
}

