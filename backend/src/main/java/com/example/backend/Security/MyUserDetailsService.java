package com.example.backend.Security;


import com.example.backend.Entity.AccountStatus;
import com.example.backend.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MyUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String userId) throws UsernameNotFoundException {

        // 사용자 조회, 없으면 예외 발생
        var user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다."));;

        if (user == null) {
            throw new UsernameNotFoundException("ㄲㅈ");
        }

        // 영구 정지 상태 조회
        // BANNED : 영정
        if (user.getStatus() == AccountStatus.BANNED) {
            throw new DisabledException("이 계정은 영구적으로 정지되었습니다.");
        }

        // 임시 정지 상태 조회
        // SUSPENDED : 임시 정지
        // ACTIVE : 정지 풀림 상태
        if (user.getStatus() == AccountStatus.SUSPENDED) {
            // 정지 만료일에 따라 로그인 불가
            if (user.getSuspensionEndDate() != null && user.getSuspensionEndDate().isAfter(LocalDateTime.now())) {
                throw new DisabledException("이 계정은 " + user.getSuspensionEndDate() + "까지 이용이 정지되었습니다.");
            } else {

                user.setStatus(AccountStatus.ACTIVE);
                user.setSuspensionEndDate(null);
                userRepository.save(user);
            }
        }

        // 권한 부여 위한 리스트
        List<GrantedAuthority> authorities = new ArrayList<>();

        // 권한 부여
        authorities.add(new SimpleGrantedAuthority("ROLE_NORMAL"));

        // 아이디가 admin일 경우 관리자 권한
        if(user.getUserId().equals("admin")) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }

        // 유저 ID를 포함한 커스텀 유저 정보 객체
        var customUserDetail = new CustomUserDetails(user.getUserName(),
                user.getUserPw(),
                authorities);

        // 커스텀 객체에 유저 Id Get()
        customUserDetail.userId = user.getUserId();
        customUserDetail.userEmail = user.getUserEmail();
        customUserDetail.userProfile = user.getUserProfile();
        customUserDetail.userNickName = user.getUserNickName();
        customUserDetail.userTags = user.getUserTags();
        customUserDetail.userIntro = user.getUserIntro();
        customUserDetail.userStatusMessage = user.getUserStatusMessage();
        customUserDetail.status = user.getStatus();


        // 커스텀 유저 정보 객체 반환
        return customUserDetail;
        /*
        // UserDetails 객체 반환
        return new org.springframework.security.core.userdetails.User(
                user.getUserName(), // 사용자 d
                user.getUserPw(), // 비밀번호
                authorities // 권한 목록
        );
        */
    }

    // UserDetail 커스텀
    // 기본값으로 유저 이름, 비밀번호, 권한 3가지 외
    // 유저Id, 유저 이메일, 유저 프로필을 추가하여 반환한다. 
    public class CustomUserDetails extends User {
        public String userId;
        public String userEmail;
        public String userProfile;
        public String userNickName;
        public List<String>userTags;
        public String userIntro;
        public String userStatusMessage;
        public AccountStatus status;


        public CustomUserDetails(String username,
                                 String password,
                                 List<GrantedAuthority> authorities) {
            super(username, password, authorities);
        }
    }
}

