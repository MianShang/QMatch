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

        insertIfNotExists("lol", "솔로랭크", "gamemode");
        insertIfNotExists("lol", "자유랭크", "gamemode");
        insertIfNotExists("lol", "칼바람나락", "gamemode");
        insertIfNotExists("lol", "우르프", "gamemode");
        insertIfNotExists("lol", "아레나", "gamemode");
        insertIfNotExists("lol", "그 외 모드", "gamemode");

        insertIfNotExists("maplestory", "스우", "Boss");
        insertIfNotExists("maplestory", "데미안", "Boss");
        insertIfNotExists("maplestory", "가엔슬", "Boss");
        insertIfNotExists("maplestory", "가엔슬", "Boss");
        insertIfNotExists("maplestory", "루시드", "Boss");
        insertIfNotExists("maplestory", "윌", "Boss");
        insertIfNotExists("maplestory", "더스크", "Boss");
        insertIfNotExists("maplestory", "진 힐라", "Boss");
        insertIfNotExists("maplestory", "듄켈", "Boss");
        insertIfNotExists("maplestory", "검은마법사", "Boss");
        insertIfNotExists("maplestory", "세렌", "Boss");
        insertIfNotExists("maplestory", "칼로스", "Boss");
        insertIfNotExists("maplestory", "최초의 대적자", "Boss");
        insertIfNotExists("maplestory", "카링", "Boss");
        insertIfNotExists("maplestory", "림보", "Boss");
        insertIfNotExists("maplestory", "발드릭스", "Boss");

        insertIfNotExists("lostark", "사멸",  "포지션");
        insertIfNotExists("lostark", "타대", "포지션");
        insertIfNotExists("lostark", "서포터", "포지션");
        insertIfNotExists("lostark", "발탄", "군단장 레이드");
        insertIfNotExists("lostark", "비아키스", "군단장 레이드");
        insertIfNotExists("lostark", "쿠크 세이튼", "군단장 레이드");
        insertIfNotExists("lostark", "아브렐슈드", "군단장 레이드");
        insertIfNotExists("lostark", "일리아칸", "군단장 레이드");
        insertIfNotExists("lostark", "카멘", "군단장 레이드");
        insertIfNotExists("lostark", "서막 : 에키드나", "카제로스 레이드");
        insertIfNotExists("lostark", "1막 : 에기르", "카제로스 레이드");
        insertIfNotExists("lostark", "2막 : 아브렐슈드", "카제로스 레이드");
        insertIfNotExists("lostark", "3막 : 모르둠", "카제로스 레이드");
        insertIfNotExists("lostark", "4막 : 아르모체", "카제로스 레이드");
        insertIfNotExists("lostark", "종막 : 카제로스", "카제로스 레이드");
        insertIfNotExists("lostark", "베히모스", "에픽 레이드");

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
