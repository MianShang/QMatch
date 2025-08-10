package com.example.backend.Service;

import com.example.backend.Dto.Response.UserResponseDto;
import com.example.backend.Entity.User;
import com.example.backend.Repository.UserRepository;
import jakarta.servlet.ServletContext;
import lombok.RequiredArgsConstructor;
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

        // 절대경로를 URL로 저장 (http://localhost:8080/uploads/profile/파일명)
        // 이렇게 안하니까 자꾸 접근이 안되는데 왜 일까 대체
        String imagePath = "/uploads/profile/" + fileName;
        user.setUserProfile(imagePath);
        //
        userRepository.save(user);

        // 응답 반환
        return new UserResponseDto(
                user.getUserId(),
                user.getUserName(),
                user.getUserEmail(),
                user.getUserProfile(),
                user.getUserStatusMessage(),
                user.getUserIntro()
        );
    }

    //내 소개 저장 및 수정
    public UserResponseDto updateUserIntro(String userId, String introduceText) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("그런 유저는 없어"));

        user.setUserIntro(introduceText);
        userRepository.save(user);

        // 응답 반환
        return new UserResponseDto(
                user.getUserId(),
                user.getUserName(),
                user.getUserEmail(),
                user.getUserProfile(),
                user.getUserStatusMessage(),
                user.getUserIntro()
        );
    }

    //내 소개 조회
    public UserResponseDto getUserIntro(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(()-> new RuntimeException("그런 유저는 없어"));

        return new UserResponseDto(
                user.getUserId(),
                user.getUserName(),
                user.getUserEmail(),
                user.getUserProfile(),
                user.getUserStatusMessage(),
                user.getUserIntro()
        );
    }

    //상태 메시지
    public UserResponseDto UserStatusMessage(String userId , String statusMessage) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("그런 유저는 없어"));

        user.setUserStatusMessage(statusMessage);
        userRepository.save(user);

        return new UserResponseDto(
                user.getUserId(),
                user.getUserName(),
                user.getUserEmail(),
                user.getUserProfile(),
                user.getUserStatusMessage(),
                user.getUserIntro()
        );
    }

    //상태메시지 조회
    public UserResponseDto getUserStatusMessage(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(()-> new RuntimeException("그런 유저는 없어"));

        return new UserResponseDto(
                user.getUserId(),
                user.getUserName(),
                user.getUserEmail(),
                user.getUserProfile(),
                user.getUserStatusMessage(),
                user.getUserIntro()
        );
    }

}
