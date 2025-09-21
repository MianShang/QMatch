package com.example.backend.Dto.Response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FriendChatRoomResponseDto {
    private Long roomId;

    public FriendChatRoomResponseDto(long roomId) {
        this.roomId = roomId;
    }
}
