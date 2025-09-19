package com.example.backend.Controller;

import com.example.backend.Dto.Response.FriendChatRoomResponseDto;
import com.example.backend.Service.FriendShipChatRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/friends/chatroom")
public class FriendChatRoomController {

    private final FriendShipChatRoomService friendShipChatRoomService;
    
    
    //채팅방 ID 가져오기
    @GetMapping("{friendId}/{userId}")
    public FriendChatRoomResponseDto getChatRoomId(@PathVariable String friendId, @PathVariable String userId) {
        long roomId = friendShipChatRoomService.getCreateChatRoom(friendId, userId);
        return new FriendChatRoomResponseDto(roomId);
    }
    
    
}
