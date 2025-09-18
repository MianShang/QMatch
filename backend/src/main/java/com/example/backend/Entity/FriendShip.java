package com.example.backend.Entity;

import com.example.backend.enums.FriendShipStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "friendships")
@EntityListeners(AuditingEntityListener.class)
public class FriendShip {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "addressee_id", nullable = false)
    private User addressee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FriendShipStatus status;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToOne(mappedBy = "friendship", cascade = CascadeType.ALL, orphanRemoval = true)
    private FriendShipChatRoom chatRoom;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public FriendShip(User requester, User addressee, FriendShipStatus status) {
        this.requester = requester;
        this.addressee = addressee;
        this.status = status;
        this.chatRoom = new FriendShipChatRoom(this);
    }
}
