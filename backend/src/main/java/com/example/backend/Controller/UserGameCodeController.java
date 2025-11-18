package com.example.backend.Controller;

import com.example.backend.Dto.Request.GameCodeRequestDto;
import com.example.backend.Entity.UserGameCode;
import com.example.backend.Service.UserGameCodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
public class UserGameCodeController {

    private final UserGameCodeService userGameCodeService;

    // 유저 전적 저장을 위한 API
    @PostMapping("/api/save/gamecode")
    public ResponseEntity<?> saveUserGameCode(@RequestBody GameCodeRequestDto gameCodeRequestDto) {

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

    @DeleteMapping("/api/delete/gamecode/{id}")
    public ResponseEntity<String> deleteUserGameCode(@PathVariable Long id) {
        try {
            userGameCodeService.deleteGameCode(id);
            // 삭제 성공 시 200 OK 상태 코드와 메시지 반환
            return ResponseEntity.ok(id + "번 데이터 삭제 성공");
        } catch (IllegalArgumentException e) {
            // Service에서 데이터가 없다고 예외를 발생시킨 경우
            // 404 Not Found 상태 코드와 에러 메시지 반환
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    // 대표 캐릭터 설정을 위한 API
    @PutMapping("/api/user-game-codes/{gameCode}/set-main")
    @PreAuthorize("isAuthenticated()") // 로그인한 사용자만 호출 가능
    public ResponseEntity<String> setMainGameCode(@PathVariable Long gameCode, Authentication authentication) {
        try {
            // 현재 로그인한 사용자의 id를 가져옴
            String userId = authentication.getName();
            userGameCodeService.setMainGameCode(userId, gameCode);
            return ResponseEntity.ok("대표 계정이 성공적으로 설정되었습니다.");
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }


}