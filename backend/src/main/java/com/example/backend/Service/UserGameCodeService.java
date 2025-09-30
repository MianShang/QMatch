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
    // Controller에 있던 Repository들을 Service로 가져옵니다.
    private final UserGameCodeRepository userGameCodeRepository;
    private final UserRepository userRepository;

    @Transactional
    public String addGameCode(GameCodeRequestDto gameCodeRequestDto) {
        // 1. 유저를 찾습니다.
        User user = userRepository.findByUserId(gameCodeRequestDto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        // 2. (선택사항) 동일한 유저, 게임, '캐릭터 이름'이 이미 존재하는지 중복 체크
        // 이렇게 하면 똑같은 캐릭터를 두 번 등록하는 것을 방지할 수 있습니다.
        Optional<UserGameCode> isDuplicate = userGameCodeRepository.findByUserAndGameNameAndGameCode(
                user,
                gameCodeRequestDto.getGameName(),
                gameCodeRequestDto.getGameCode()
        );

        if (isDuplicate.isPresent()) {
            // 이미 등록된 캐릭터라면 에러 메시지를 반환하거나 아무것도 하지 않음
            return "이미 등록된 캐릭터입니다.";
        }

        // 3. 중복이 아니면, '항상' 새로운 UserGameCode 객체를 생성하여 저장합니다.
        // 이렇게 해야 부캐가 계속 추가됩니다.
        UserGameCode newGameCode = new UserGameCode();
        newGameCode.setUser(user);
        newGameCode.setGameName(gameCodeRequestDto.getGameName());
        newGameCode.setGameCode(gameCodeRequestDto.getGameCode());

        userGameCodeRepository.save(newGameCode);

        return "새로운 캐릭터 저장 성공";
    }


    @Transactional(readOnly = true) // 읽기 전용 트랜잭션
    public List<UserGameCode> findUserGameCodes(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
        return userGameCodeRepository.findByUser(user);
    }

    @Transactional(readOnly = true)
    public Optional<UserGameCode> findUserGameData(String userId, String gameName) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
        return userGameCodeRepository.findByUserAndGameName(user, gameName);
    }
}