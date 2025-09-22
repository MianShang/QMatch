package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class FriendShipChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    //친구관계 엔티티 비교후 채팅방 생성
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "friendship_id", nullable = false)
    private FriendShip friendship;


    @OneToMany(mappedBy = "friendShipChatRoom", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FriendShipChatMessage> messages;

    //채팅방 생성 시간
    @CreationTimestamp
    private LocalDateTime createdAt;

    public FriendShipChatRoom(FriendShip friendship) {
        this.friendship = friendship;
    }
}
