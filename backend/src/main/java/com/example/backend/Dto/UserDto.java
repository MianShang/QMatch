package com.example.backend.Dto;

import com.example.backend.Entity.User;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserDto {
    private String userId;
    private String userName;
    private String userEmail;


    // User 엔티티를 인수로 받는 생성자
    public UserDto(User user) {
        this.userId = user.getUserId();
        this.userName = user.getUserName();
        this.userEmail = user.getUserEmail();
    }
}
