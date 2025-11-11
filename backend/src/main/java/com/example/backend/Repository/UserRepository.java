package com.example.backend.Repository;

import com.example.backend.Entity.User;
import org.springframework.data.repository.CrudRepository;

import java.util.Optional;

public interface UserRepository extends CrudRepository<User, Long> {

    // 유저 아이디로 유저 검색
    Optional<User> findByUserId(String userId);

    // 유저 Id 중복 체크
    boolean existsByUserId(String userId);
    
    // 이메일로 유저 검색
    Optional<User> findByUserEmail(String userEmail);
}
