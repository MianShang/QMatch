package com.example.backend.Dto.Response;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class FriendChatMessageResponseDto {

    private Long id;
    private Long chatroomId;
    private LocalDateTime sendtime;
    private String content;
    private Long userid;

}
