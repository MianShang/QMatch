package com.example.backend.Repository;

import com.example.backend.Entity.GameTag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GameTagRepository extends JpaRepository<GameTag, Long> {
    List<GameTag> findByGameName(String gameName);
    boolean existsByGameNameAndTagNameAndCategory(String gameName, String tagName, String category);

}
