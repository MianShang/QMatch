package com.example.backend.Service;

import com.example.backend.Dto.Request.UserRequestDto;
import com.example.backend.Entity.User;
import com.example.backend.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;


    // 이 메서드는 회원가입 유저의 DB 저장 로직 서비스다
    public void saveUser(UserRequestDto user) {
        if (user.getUserId() == null
                || user.getUserEmail()  == null
                || user.getUserPw()     == null
                || user.getUserName()   == null
                || user.getUserAge()    == null
                || user.getUserPhone()  == null
                || user.getUserNickName() == null) {

            // input란이 하나라도 null일시 예외처리
            throw new IllegalArgumentException("필수 값 누락");
        }

        if (userRepository.existsByUserId(user.getUserId())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        } //아이디 중복 체크

        User saveUser = new User();

        saveUser.setUserId(user.getUserId());
        saveUser.setUserEmail(user.getUserEmail());
        saveUser.setUserPw(passwordEncoder.encode(user.getUserPw()));
        saveUser.setUserName(user.getUserName());
        saveUser.setUserAge(user.getUserAge());
        saveUser.setUserPhone(user.getUserPhone());
        saveUser.setUserName(user.getUserName());
        saveUser.setUserNickName(user.getUserNickName());

        // 비밀번호 해싱
        //user.setUserPw(passwordEncoder.encode(user.getUserPw()));

        // DB 저장
        userRepository.save(saveUser);
    }

    // 비밀번호 업데이트
    public void updatePassword(String userId, String newPassword) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        user.setUserPw(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

}
