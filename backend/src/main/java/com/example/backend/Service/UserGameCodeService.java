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

        Optional<UserGameCode> mainAccount = userGameCodeRepository.findByUserAndGameNameAndIsMainTrue(user, gameName);

        if (mainAccount.isPresent()) {
            return mainAccount;
        }

        return userGameCodeRepository.findByUserAndGameName(user, gameName).stream().findFirst();
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

    @Transactional
    public void setMainGameCode(String userId, Long gameCode) {

        //유저 찾기
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
        //대표로 설정할 게임 찾기
        UserGameCode newMainAccount = userGameCodeRepository.findById(gameCode)
                .orElseThrow(() -> new IllegalArgumentException("게임 계정을 찾을 수 없습니다."));

        //요청한 게정이 본인인지
        if (!newMainAccount.getUser().equals(user)) {
            throw new SecurityException("계정을 변경할 권한이 없습니다.");
        }

        String gameName = newMainAccount.getGameName();

        //같은 게임을 모두 false로 초기화
        List<UserGameCode> allAccountsForGame = userGameCodeRepository.findByUserAndGameName(user, gameName);
        for (UserGameCode account : allAccountsForGame) {
            account.setMain(false);
        }

        //선택한 대표 게정만 메인 계정으로
        newMainAccount.setMain(true);

    }
}