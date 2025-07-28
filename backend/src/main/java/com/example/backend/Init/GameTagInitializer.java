package com.example.backend.Init;

import com.example.backend.Entity.GameTag;
import com.example.backend.Repository.GameTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GameTagInitializer implements CommandLineRunner {

    private final GameTagRepository gameTagRepository;

    @Override
    public void run(String... args) {
        insertIfNotExists("lol", "탑");
        insertIfNotExists("lol", "정글");
        insertIfNotExists("lol", "미드");
        insertIfNotExists("lol", "원딜");
        insertIfNotExists("lol", "서포터");

        insertIfNotExists("maplestory", "아델");
        insertIfNotExists("maplestory", "메르세데스");
        insertIfNotExists("maplestory", "아란");

        insertIfNotExists("lostark", "바드");
        insertIfNotExists("lostark", "버서커");
        insertIfNotExists("lostark", "서머너");

        insertIfNotExists("dnf", "거너");

        insertIfNotExists("tft", "뉴비");
        insertIfNotExists("tft", "고인물");
    }

     // 특정 게임 / 태그 조합이 DB에 없으면 새로 삽입
    private void insertIfNotExists(String gameName, String tagName) {
        boolean exists = gameTagRepository.existsByGameNameAndTagName(gameName, tagName);
        if (!exists) {
            gameTagRepository.save(new GameTag(null, gameName, tagName));
            System.out.println("GameTag 추가! : " + gameName + " / " + tagName);
        }
    }
}
