package com.example.backend.Service;

import com.example.backend.Dto.Response.UserResponseDto;
import com.example.backend.Entity.User;
import com.example.backend.Repository.UserRepository;
import jakarta.servlet.ServletContext;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.apache.catalina.startup.RealmRuleSet;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.File;
import java.io.IOException;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;

    public UserResponseDto userProfileImage(String userId, MultipartFile file) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("그런 유저는 없어"));

        // 폴더 생성 위치 설정
        String relativePath = "uploads/profile";

        // 실제 절대 경로를 반환하고 없다면 파일 생성
        String uploadPath = new File(relativePath).getAbsolutePath();
        File uploadDir = new File(uploadPath);
        if (!uploadDir.exists()) uploadDir.mkdirs();

        // 이미지 파일명 생성
        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        File dest = new File(uploadDir, fileName);

        try {
            System.out.println("저장 대상 경로: " + dest.getAbsolutePath());
            file.transferTo(dest);
            System.out.println("파일 저장 성공: " + dest.getName());
        } catch (IOException e) {
            throw new RuntimeException("파일 저장 실패요", e);
        }


        String imagePath = "/uploads/profile/" + fileName;
        user.setUserProfile(imagePath);
        //
        userRepository.save(user);

        return UserResponseDto.from(user);
    }

    //내 소개 저장 및 수정
    public UserResponseDto updateUserIntro(String userId, String introduceText) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("그런 유저는 없어"));

        user.setUserIntro(introduceText);
        userRepository.save(user);

        // 응답 반환
//        return new UserResponseDto(
//                user.getUserId(),
//                user.getUserName(),
//                user.getUserEmail(),
//                user.getUserProfile(),
//                user.getUserTags(),
//                user.getUserStatusMessage(),
//                user.getUserIntro(),
//                null // joinStatus는 프로필 관련 서비스에서는 null
//        );
        return UserResponseDto.from(user);
    }

    //내 소개 조회
    public UserResponseDto getUserIntro(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(()-> new RuntimeException("그런 유저는 없어"));

        return UserResponseDto.from(user);
    }

    //상태 메시지
    public UserResponseDto UserStatusMessage(String userId , String statusMessage) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("그런 유저는 없어"));

        user.setUserStatusMessage(statusMessage);
        userRepository.save(user);

        return UserResponseDto.from(user);

    }

    //상태메시지 조회
    public UserResponseDto getUserStatusMessage(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(()-> new RuntimeException("그런 유저는 없어"));


        return UserResponseDto.from(user);
    }

    //태그
    @Transactional
    public UserResponseDto updateUserTag(String userId, String userTag){
        User user = userRepository.findByUserId(userId)
                .orElseThrow(()->new RuntimeException("그런 유저는 없어"));

        user.getUserTags().add(userTag);
        userRepository.save(user);

        return UserResponseDto.from(user);
    }

    //태그 조회
    public UserResponseDto getUserTag(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(()-> new RuntimeException("그런 유저는 없어"));

        return UserResponseDto.from(user);
    }

    //닉네임 조회
    public UserResponseDto getUserNickname(String userId){
        User user = userRepository.findByUserId(userId)
                .orElseThrow(()-> new RuntimeException("그런 유저는 없어"));

        return UserResponseDto.from(user);
    }

    //닉네임 등록
    @Transactional
    public UserResponseDto updateUserNickname(String userId, String nickName){
        User user = userRepository.findByUserId(userId)
                .orElseThrow(()->new RuntimeException("그런 유저는 없어"));

        user.setUserNickName(nickName);
        userRepository.save(user);

        return UserResponseDto.from(user);
    }


}
