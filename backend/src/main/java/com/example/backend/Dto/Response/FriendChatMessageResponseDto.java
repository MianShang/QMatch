package com.example.backend.Dto.Response;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class FriendChatMessageResponseDto {

    private Long id;
    private Long chatroomId;
    private LocalDateTime chatDate;
    private String message;
    private String name;
    private String userName;

}
