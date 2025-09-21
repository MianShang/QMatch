package com.example.backend.Dto.Response;

import com.example.backend.Entity.ChatRoom;
import com.example.backend.Entity.Role;
import com.example.backend.enums.ChatRoomUserStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserChatRoomResponseDto {
    private long id;
    private ChatRoom chatRoom;
    private Role role;
    private ChatRoomUserStatus status;
    private String hostUserId; // 방장 ID 추가
}