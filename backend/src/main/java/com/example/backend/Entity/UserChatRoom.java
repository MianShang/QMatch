package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(
        name = "user_chat_room",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "chat_room_id"})
)
@Getter
@Setter
public class UserChatRoom {
    @Id
    @GeneratedValue
    private long id;

    @ManyToOne                          // User 테이블과 다대일 관계
    @JoinColumn(name = "user_id")       // FK 컬럼명
    private User user;

    @ManyToOne                          // ChatRoom 테이블과 다대일 관계
    @JoinColumn(name = "chat_room_id")  // DB에 저장될 컬럼명
    private ChatRoom chatRoom;

    // 멤버인지 방장인지 구분
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role; // HOST, MEMBER

    protected UserChatRoom() {}

    public UserChatRoom(User user, ChatRoom chatRoom, Role role) {
        this.user = user;
        this.chatRoom = chatRoom;
        this.role = role;
    }
}
