package com.example.backend.Dto.Request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import jakarta.validation.Valid;


@Getter
@Setter
public class UserRequestDto {

    @Size(min = 4, max = 20, message = "아이디는 4자 이상 20자 이하로 입력해주세요.")
    private String userId;      // 유저 아이디
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*[!@#$%^&*()_+=~`]).{8,16}$",
            message = "비밀번호는 8~16자의 영문 대/소문자, 숫자, 특수문자를 사용하세요. (대문자와 특수문자 각 1개 이상 포함)")
    private String userPw;      // 유저 비밀번호
    private String userName;    // 유저 이름
    private String userEmail;   // 유저 이메일
    private String userProfile; // 유저 프로필 이미지
    private String userStatusMessage; //유저 상태메시지
    private String userIntro; //유저 소개
}
