package com.example.backend.Dto.Response;

import com.example.backend.Entity.User;
import com.example.backend.Security.MyUserDetailsService;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;
import java.util.List;

// 반환되는 유저의 정보 DTO를 정의한다.
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDto {
    private String userId;
    private String userName;
    private String userEmail;
    private String userProfile;
    private List<String> userTags;
    private String userStatusMessage;
    private String userIntro;
    private String status;
    private Collection<GrantedAuthority> authorities;


    //로그인 했을때 내 정보
    public static UserResponseDto from(MyUserDetailsService.CustomUserDetails userDetails) {
        return UserResponseDto.builder()
                .userId(userDetails.userId)
                .userName(userDetails.getUsername())
                .userEmail(userDetails.userEmail)
                .userProfile(userDetails.userProfile)
                .userTags(userDetails.userTags)
                .userStatusMessage(userDetails.userStatusMessage)
                .userIntro(userDetails.userIntro)
                .status(userDetails.status != null ? userDetails.status.getDescription() : "null")
                .authorities(userDetails.getAuthorities())
                .build();
    }

    //관리자 회원 목록에 사용
    public static UserResponseDto from(User user) {
        return UserResponseDto.builder()
                .userId(user.getUserId())
                .userName(user.getUserName())
                .userEmail(user.getUserEmail())
                .userProfile(user.getUserProfile())
                .userTags(user.getUserTags())
                .userStatusMessage(user.getUserStatusMessage())
                .userIntro(user.getUserIntro())
                .status(user.getStatus() != null ? user.getStatus().getDescription() : "null")
                .authorities(null)
                .build();
    }


}

