package com.example.backend.Entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"name", "gameName"})
)
@Getter @Setter
public class ChatRoom {
    @Id
    private String id;

    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private String gameName;

    @Column(nullable = false)
    private int maxUsers; // 최대 인원 (0~20 사이)

    @Column(nullable = false)
    private int currentUsers; // 기본값 1 (방장)

    @Column(nullable = false)
    private String joinType = "approval"; // 입장 방식: "approval" (방장 승인) 또는 "free" (자유 입장)

    // 방장 정보 (User와 연관관계)
    @ManyToOne
    private User owner;

    @OneToMany(mappedBy = "chatRoom", cascade = CascadeType.ALL, orphanRemoval = true)   // 채팅방과 태그의 연결 관계, ChatRoom ↔ ChatRoomTag (1:N)
    @JsonIgnore     // 순환 참조 방지
    @JsonManagedReference
    private List<ChatRoomTag> chatRoomTags = new ArrayList<>();

    protected ChatRoom() {}

    public ChatRoom(String id, String name, int maxUsers, User owner) {
        this.id = id;
        this.name = name;
        this.currentUsers = 1;
        this.owner = owner;
    }
}

