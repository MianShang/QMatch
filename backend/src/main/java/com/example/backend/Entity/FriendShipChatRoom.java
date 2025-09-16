package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class FriendShipChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    //친구관계 엔티티 비교후 채팅방 생성
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "friendship_id", nullable = false)
    private FriendShip friendship;

    //채팅방 생성 시간
    @CreatedDate
    private LocalDateTime createdAt;
}
