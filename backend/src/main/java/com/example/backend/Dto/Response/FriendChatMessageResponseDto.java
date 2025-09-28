package com.example.backend.Dto.Response;

import com.example.backend.Entity.FriendShipChatMessage;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class FriendChatMessageResponseDto {

    private Long id;
    private Long chatroomId;
    private LocalDateTime chatDate;
    private String message;
    private String name;
    private String userName;

    public FriendChatMessageResponseDto(FriendShipChatMessage message) {
        this.id = message.getId();
        this.chatroomId = message.getFriendShipChatRoom().getId();
        this.chatDate = message.getSendTime();
        this.message = message.getMessage();
        this.name = message.getUser().getUserId();
        this.userName = message.getUser().getUserName();
    }

}
