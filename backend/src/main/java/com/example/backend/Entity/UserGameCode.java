package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class UserGameCode {
    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;


    private String gameCode;
    private String gameName;

    @Column(nullable = false)
    private boolean isMain = false; //대표 게정

}
