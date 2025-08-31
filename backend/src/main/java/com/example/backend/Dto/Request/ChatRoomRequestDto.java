package com.example.backend.Dto.Request;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter @Setter
public class ChatRoomRequestDto {
    private String chatName;
    private String gameName;
    private List<Long> tags;  // 선택한 태그 ID들
    private String userId;
    private String creatorUserId;
}
