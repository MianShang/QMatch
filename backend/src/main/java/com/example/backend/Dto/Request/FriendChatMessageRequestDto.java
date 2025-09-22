package com.example.backend.Dto.Request;


import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FriendChatMessageRequestDto {
    private String sendId;
    private String message;
}
