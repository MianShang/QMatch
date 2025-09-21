package com.example.backend.Dto.Request;

import com.example.backend.enums.ChatRoomUserStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoomJoinResponseDto {
    private String userId;
    private String roomId;
    private ChatRoomUserStatus status;
    private String message;
    
    public RoomJoinResponseDto(String userId, String roomId, ChatRoomUserStatus status, String message) {
        this.userId = userId;
        this.roomId = roomId;
        this.status = status;
        this.message = message;
    }
}
