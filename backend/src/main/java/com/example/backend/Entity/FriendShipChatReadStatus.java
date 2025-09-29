package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"chat_room_id", "user_id"})
)
public class FriendShipChatReadStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "chatroom_id", nullable = false)
    private FriendShipChatRoom friendShipChatRoom;

    private Long lastReadMessageId;

    public FriendShipChatReadStatus(FriendShipChatRoom friendShipChatrRoom, String userId, Long lastReadMessageId) {
        this.friendShipChatRoom = friendShipChatrRoom;
        this.userId = userId;
        this.lastReadMessageId = lastReadMessageId;
    }
}
