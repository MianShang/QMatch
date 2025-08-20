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
        insertIfNotExists("lol", "탑", "line");
        insertIfNotExists("lol", "정글", "line");
        insertIfNotExists("lol", "미드", "line");
        insertIfNotExists("lol", "원딜", "line");
        insertIfNotExists("lol", "서포터", "line");

        insertIfNotExists("lol", "아이언", "tier");
        insertIfNotExists("lol", "브론즈", "tier");
        insertIfNotExists("lol", "실버", "tier");
        insertIfNotExists("lol", "골드", "tier");
        insertIfNotExists("lol", "플레티넘", "tier");
        insertIfNotExists("lol", "다이아몬드", "tier");
        insertIfNotExists("lol", "마스터", "tier");
        insertIfNotExists("lol", "그랜드마스터", "tier");
        insertIfNotExists("lol", "챌린저", "tier");
        

        insertIfNotExists("maplestory", "아델", "class");
        insertIfNotExists("maplestory", "메르세데스", "class");
        insertIfNotExists("maplestory", "아란", "class");

        insertIfNotExists("lostark", "바드",  "class");
        insertIfNotExists("lostark", "버서커", "class");
        insertIfNotExists("lostark", "서머너", "class");

        insertIfNotExists("dnf", "거너", "class");

        insertIfNotExists("tft", "뉴비", "puser");
        insertIfNotExists("tft", "고인물", "puser");
    }

     // 특정 게임 / 태그 조합이 DB에 없으면 새로 삽입
    private void insertIfNotExists(String gameName, String tagName, String category) {
        boolean exists = gameTagRepository.existsByGameNameAndTagNameAndCategory(gameName, tagName, category);
        ;
        if (!exists) {
            gameTagRepository.save(new GameTag(null, gameName, tagName, category));
            System.out.println("GameTag 추가! : " + gameName + " / " + tagName + " / " + category);
        }
    }
}
