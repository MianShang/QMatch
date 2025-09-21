package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter

public class FriendShipChatUnRead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    //수신자
    private String receiveId;

    // 발신자
    private String sendId;
    
    //채팅방 참조
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chatroom_id")
    private FriendShipChatRoom friendShipChatRoom;
    
    //메시지 참조
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id")
    private FriendShipChatMessage message;
}
