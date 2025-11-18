package com.example.backend.Service;

import com.example.backend.Dto.Response.UserResponseDto;
import com.example.backend.Security.MyUserDetailsService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    // 로그인 체크 Service
    public boolean isLoggedIn(HttpSession session) {

        // 현재 브라우저의 세션 정보를 가져온다
        Object context = session.getAttribute("SPRING_SECURITY_CONTEXT");

        // 존재시 현재 로그인 상태
        if(context != null) {
            return true;
        } else {
            return false;
        }
    }


    // 유저 정보 반환 Service
    public UserResponseDto getUserData(Authentication auth){
        if (auth == null) {
            throw new IllegalArgumentException("Authentication 정보가 없습니다.");
        }

        Object principal = auth.getPrincipal();
        if (!(principal instanceof MyUserDetailsService.CustomUserDetails)) {
            throw new IllegalStateException("잘못된 사용자 정보입니다.");
        }

        MyUserDetailsService.CustomUserDetails user = (MyUserDetailsService.CustomUserDetails) principal;

        return UserResponseDto.from(user);
    }


}
