package com.example.backend.Repository;

import com.example.backend.Entity.User;
import com.example.backend.Entity.UserGameCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserGameCodeRepository extends JpaRepository<UserGameCode, Long> {

    // 저장된 게임 코드들 찾기
    List<UserGameCode> findByUserOrderByGameNameAsc(User user);

    // 대표 계정
    Optional<UserGameCode> findByUserAndGameNameAndIsMainTrue(User user, String gameName);

    // 중복저장 방지 위한 유저 - 게임 이름 으로 중복 여부 검사
    List<UserGameCode> findByUserAndGameName(User user, String gameName);

    Optional<UserGameCode> findByUserAndGameNameAndGameCode(User user, String gameName, String gameCode);


}
