package com.example.backend.Controller;

import com.example.backend.Dto.Request.GameCodeRequestDto;
import com.example.backend.Entity.UserGameCode;
import com.example.backend.Service.UserGameCodeService; // 새로 만든 Service import
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
public class UserGameCodeController {
    // Repository 대신 Service를 주입받습니다.
    private final UserGameCodeService userGameCodeService;

    // 유저 전적 저장을 위한 API
    @PostMapping("/api/save/gamecode")
    public ResponseEntity<?> saveUserGameCode(@RequestBody GameCodeRequestDto gameCodeRequestDto) {
        // 복잡한 로지은 Service의 메소드 호출 한 줄로 끝납니다.
        String message = userGameCodeService.addGameCode(gameCodeRequestDto);
        return ResponseEntity.ok(message);
    }

    // 로그인한 유저의 게임 코드 검색을 위한 API
    @GetMapping("/api/get/user/gamecode")
    public ResponseEntity<List<UserGameCode>> getUserGameCode(@RequestParam String userId) {
        List<UserGameCode> userGameCodes = userGameCodeService.findUserGameCodes(userId);
        return ResponseEntity.ok(userGameCodes);
    }

    // 채팅방의 유저 리스트에서 특정 유저의 게임 코드와 게임 이름으로 전적 검색위한 API
    @GetMapping("/api/get/user/gamedata")
    public ResponseEntity<?> getUserGameData(@RequestParam String userId, @RequestParam String gameName) {
        Optional<UserGameCode> userGameCode = userGameCodeService.findUserGameData(userId, gameName);
        if (userGameCode.isEmpty()) {
            return ResponseEntity.ok("null"); // 또는 적절한 상태 코드로 응답
        }
        return ResponseEntity.ok(userGameCode.get());
    }
}