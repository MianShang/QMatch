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
    private int maxUsers;
    private String joinType = "approval"; // 입장 방식: "approval" (방장 승인) 또는 "free" (자유 입장)
}
