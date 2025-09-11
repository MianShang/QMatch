package com.example.backend.Dto.Response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// 반환되는 유저의 정보 DTO를 정의한다.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDto {
    private String userId;
    private String userName;
    private String userEmail;
    private String userProfile;
    private String userStatusMessage;
    private String userIntro;
}
