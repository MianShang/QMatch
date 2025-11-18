package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.util.Date;

@Entity
@Getter
@Setter
public class ChatList {
    @Id
    @GeneratedValue
    private long id;                    // 기본키 컬럼 ID

    @Column(length = 2000)
    private String chatContent;         // 채팅 내용

    @CreationTimestamp
    private Date chatDate;              // 채팅 시간 (자동 입력)

    @ManyToOne
    @JoinColumn(name="chat_room_id")
    private ChatRoom chatRoom;          // 해당 채팅방

    @ManyToOne
    @JoinColumn(name="user_id", nullable = true)
    private User user;                  // 메세지 전송자 (시스템 메시지의 경우 null)
    
    private String userName;            //메세지 전송자 이름
    
    @Column(nullable = false)
    private Boolean isPinned = false;   //메시지 고정 여부
}
