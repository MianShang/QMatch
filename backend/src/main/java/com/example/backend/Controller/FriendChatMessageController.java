package com.example.backend.Controller;

import com.example.backend.Dto.Response.FriendChatMessageResponseDto;
import com.example.backend.Entity.FriendShipChatMessage;
import com.example.backend.Service.FriendShipChatMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/friends/chatroom/")
public class FriendChatMessageController {

    private final FriendShipChatMessageService friendShipChatMessageService;

    @GetMapping("{roomId}/messages")
    public List<FriendChatMessageResponseDto> getMessages(@PathVariable Long roomId)
    {
        return friendShipChatMessageService.getMessages(roomId);
    }

}
