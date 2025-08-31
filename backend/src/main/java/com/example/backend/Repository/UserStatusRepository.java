// src/main/java/com/example/backend/Repository/UserStatusRepository.java
package com.example.backend.Repository;

import com.example.backend.Entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserStatusRepository extends JpaRepository<UserStatus, Long> {
    Optional<UserStatus> findByUserId(String userId);
}
