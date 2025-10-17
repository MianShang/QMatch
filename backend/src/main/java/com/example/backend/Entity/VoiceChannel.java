package com.example.backend.Entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class VoiceChannel {
    @Id
    @GeneratedValue
    private long id;

    @ManyToOne
    @JoinColumn(name = "chat_room_id")
    @JsonBackReference
    private ChatRoom chatRoom;

    @Column(nullable = false)
    private String channelName;

    private Integer maxUsers;

}
