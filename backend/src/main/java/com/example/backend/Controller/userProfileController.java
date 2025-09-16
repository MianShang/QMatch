package com.example.backend.Controller;

import com.example.backend.Dto.Response.UserResponseDto;
import com.example.backend.Entity.User;
import com.example.backend.Repository.UserRepository;
import com.example.backend.Service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/profile")
public class userProfileController {

    private final UserProfileService userprofileService;
    private final UserRepository userRepository;

    //프로필 사진
    @PostMapping("/image")
    public ResponseEntity<UserResponseDto> uploadProfileImage(@RequestParam String userId, @RequestParam MultipartFile file) {

        UserResponseDto response = userprofileService.userProfileImage(userId, file);
        return ResponseEntity.ok(response);
    }

    //유저 정보 가져오기
    @GetMapping("/user/info")
    public ResponseEntity<UserResponseDto> getUserInfo(@RequestParam String userId) {

        UserResponseDto response = userprofileService.getUserIntro(userId);
        return ResponseEntity.ok(response);
    }

    //내 소개
    @PostMapping("/intro")
    public ResponseEntity<UserResponseDto> updateUserIntro(@RequestBody Map<String,String> data) {
        String userId = data.get("userId");
        String introText = data.get("introText");

        UserResponseDto response = userprofileService.updateUserIntro(userId, introText);
        return ResponseEntity.ok(response);
    }

    //내 소개 가져오기
    @GetMapping("/intro")
    public ResponseEntity<UserResponseDto> getUserIntro(@RequestParam String userId) {
        UserResponseDto response = userprofileService.getUserIntro(userId);
        return ResponseEntity.ok(response);
    }



    //작은 상태메시지 가져오기
    @PostMapping("/status")
    public ResponseEntity<UserResponseDto> UserStatusMessage(@RequestBody Map<String,String> data) {
        String userId = data.get("userId");
        String statusMessage = data.get("statusMessage");

        UserResponseDto response = userprofileService.UserStatusMessage(userId, statusMessage);
        return ResponseEntity.ok(response);
    }

    //작은 상태메시지
    @GetMapping("/status")
    public ResponseEntity<UserResponseDto> getUserStatusMessage(@RequestParam String userId) {
        UserResponseDto response = userprofileService.getUserStatusMessage(userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/usertag")
    public ResponseEntity<UserResponseDto> updateUserTag(@RequestBody Map<String,String> data) {
        String userId = data.get("userId");
        String userTag = data.get("userTag");

        UserResponseDto response = userprofileService.updateUserTag(userId, userTag);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/usertag")
    public ResponseEntity<UserResponseDto> getUserTag(@RequestParam String userId) {
        UserResponseDto response = userprofileService.getUserTag(userId);
        return ResponseEntity.ok(response);
    }


}
