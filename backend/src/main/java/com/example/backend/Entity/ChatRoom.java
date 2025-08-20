package com.example.backend.Entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter @Setter
public class ChatRoom {
    @Id
    private String id;

    private String name;
    private String gameName;

    @OneToMany(mappedBy = "chatRoom", cascade = CascadeType.ALL, orphanRemoval = true)   // 채팅방과 태그의 연결 관계, ChatRoom ↔ ChatRoomTag (1:N)
    @JsonIgnore     // 순환 참조 방지
    @JsonManagedReference
    private List<ChatRoomTag> chatRoomTags = new ArrayList<>();

    protected ChatRoom() {}

    public ChatRoom(String id, String name) {
        this.id = id;
        this.name = name;
    }
}

