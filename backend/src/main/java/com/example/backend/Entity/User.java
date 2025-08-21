package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
public class User {
    @Id
    @GeneratedValue
    private long id;

    @Column(unique = true)
    private String userId;      // 유저 아이디

    private String userPw;      // 유저 비밀번호
    private String userName;    // 유저 이름
    private String userEmail;   // 유저 이메일
    private String userProfile; // 유저 프로필 이미지
    private String userStatusMessage; //유저 상태메시지
    private String userIntro; //유저 소개
}
