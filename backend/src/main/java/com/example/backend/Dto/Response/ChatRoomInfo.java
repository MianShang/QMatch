package com.example.backend.Dto.Response;

import lombok.Builder;
import lombok.Getter;

// AdminUserDetailDto 내부에 포함될 채팅방 정보 DTO
@Getter
@Builder
public class ChatRoomInfo {
    private String roomId;
    private String roomName;

}
