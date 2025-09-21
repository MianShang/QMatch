package com.example.backend.Controller;

import com.example.backend.Entity.GameTag;
import com.example.backend.Repository.GameTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class GameTagController {

    // GameTag 데이터를 DB에서 조회하는 Repository 의존성 주입
    private final GameTagRepository gameTagRepository;

    @GetMapping("/{gameName}")
    public List<GameTag> getTags(@PathVariable String gameName) {
        // gameName으로 필터링하여 해당 게임의 태그만 반환
        return gameTagRepository.findByGameName(gameName);
    }
}

