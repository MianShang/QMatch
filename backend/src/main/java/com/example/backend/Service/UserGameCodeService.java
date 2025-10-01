package com.example.backend.Service; // Service 패키지에 생성

import com.example.backend.Dto.Request.GameCodeRequestDto;
import com.example.backend.Entity.User;
import com.example.backend.Entity.UserGameCode;
import com.example.backend.Repository.UserGameCodeRepository;
import com.example.backend.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserGameCodeService {

    private final UserGameCodeRepository userGameCodeRepository;
    private final UserRepository userRepository;

    @Transactional
    public String addGameCode(GameCodeRequestDto gameCodeRequestDto) {

        User user = userRepository.findByUserId(gameCodeRequestDto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        //동일한 유저, 게임, 캐릭터 중복 체크
        Optional<UserGameCode> isDuplicate = userGameCodeRepository.findByUserAndGameNameAndGameCode(
                user,
                gameCodeRequestDto.getGameName(),
                gameCodeRequestDto.getGameCode()
        );

        if (isDuplicate.isPresent()) {
            return "이미 등록된 캐릭터입니다.";
        }

        // 중복이 아니면 새로운 UserGameCode 객체를 생성하여 저장
        UserGameCode newGameCode = new UserGameCode();
        newGameCode.setUser(user);
        newGameCode.setGameName(gameCodeRequestDto.getGameName());
        newGameCode.setGameCode(gameCodeRequestDto.getGameCode());

        userGameCodeRepository.save(newGameCode);

        return "새로운 캐릭터 저장 성공";
    }


    @Transactional(readOnly = true)
    public List<UserGameCode> findUserGameCodes(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
        return userGameCodeRepository.findByUserOrderByGameNameAsc(user);
    }

    @Transactional(readOnly = true)
    public Optional<UserGameCode> findUserGameData(String userId, String gameName) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
        return userGameCodeRepository.findByUserAndGameName(user, gameName);
    }

    @Transactional
    public void deleteGameCode(Long gameCodeId) {
        boolean isPresent = userGameCodeRepository.existsById(gameCodeId);
        if (isPresent) {
            userGameCodeRepository.deleteById(gameCodeId);
        } else {
            throw new IllegalArgumentException("삭제할 데이터를 찾을 수 없습니다. ID: " + gameCodeId);
        }
    }
}