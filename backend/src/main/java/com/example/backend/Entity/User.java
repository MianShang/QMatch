package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
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

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_tags", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name= "tag")
    private List<String> userTags = new ArrayList<>();

    @Enumerated(EnumType.STRING) // Enum의 문자열을 DB에 저장
    private AccountStatus status = AccountStatus.ACTIVE; // 기본상태는 활성화로

    private LocalDateTime suspensionEndDate; // 정지 만료 날짜



}
