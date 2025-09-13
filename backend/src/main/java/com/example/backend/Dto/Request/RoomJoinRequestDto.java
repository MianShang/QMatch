package com.example.backend.Dto.Request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoomJoinRequestDto {
    private String userId;
    private String roomId;
}
