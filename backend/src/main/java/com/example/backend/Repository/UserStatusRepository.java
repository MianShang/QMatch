// src/main/java/com/example/backend/Repository/UserStatusRepository.java
package com.example.backend.Repository;

import com.example.backend.Entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserStatusRepository extends JpaRepository<UserStatus, Long> {
    Optional<UserStatus> findByUserId(String userId);
    List<UserStatus> findAllByUserIdIn(Collection<String> userIds);

    @Query("SELECT DISTINCT us FROM UserStatus us WHERE us.userId IN :userIds")
    List<UserStatus> findStatusByUserIdIn(@Param("userIds") List<String> userIds);
}
