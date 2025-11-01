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

        insertIfNotExists("dnf", "웨펀마스터", "class");
        insertIfNotExists("dnf", "소울브링어", "class");
        insertIfNotExists("dnf", "버서커", "class");
        insertIfNotExists("dnf", "아수라", "class");
        insertIfNotExists("dnf", "검귀", "class");
        insertIfNotExists("dnf", "소드마스터", "class");
        insertIfNotExists("dnf", "데몬슬레이어", "class");
        insertIfNotExists("dnf", "베가본드", "class");
        insertIfNotExists("dnf", "다크템플러", "class");
        insertIfNotExists("dnf", "블레이드", "class");
        insertIfNotExists("dnf", "넨마스터 (남)", "class");
        insertIfNotExists("dnf", "스트라이커 (남)", "class");
        insertIfNotExists("dnf", "스트리트 파이터 (남)", "class");
        insertIfNotExists("dnf", "그래플러 (남)", "class");
        insertIfNotExists("dnf", "넨마스터 (여)", "class");
        insertIfNotExists("dnf", "스트라이커 (여)", "class");
        insertIfNotExists("dnf", "스트리트 파이터 (여)", "class");
        insertIfNotExists("dnf", "그래플러 (여)", "class");
        insertIfNotExists("dnf", "레인저 (남)", "class");
        insertIfNotExists("dnf", "런처 (남)", "class");
        insertIfNotExists("dnf", "메카닉 (남)", "class");
        insertIfNotExists("dnf", "스핏파이어 (남)", "class");
        insertIfNotExists("dnf", "어썰트", "class");
        insertIfNotExists("dnf", "레인저 (여)", "class");
        insertIfNotExists("dnf", "런처 (여)", "class");
        insertIfNotExists("dnf", "메카닉 (여)", "class");
        insertIfNotExists("dnf", "스핏파이어 (여)", "class");
        insertIfNotExists("dnf", "패러메딕", "class");
        insertIfNotExists("dnf", "엘레멘탈 바머", "class");
        insertIfNotExists("dnf", "빙결사", "class");
        insertIfNotExists("dnf", "블러드 메이지", "class");
        insertIfNotExists("dnf", "스위프트 마스터", "class");
        insertIfNotExists("dnf", "디멘션 워커", "class");
        insertIfNotExists("dnf", "엘레멘탈마스터", "class");
        insertIfNotExists("dnf", "소환사", "class");
        insertIfNotExists("dnf", "배틀메이지", "class");
        insertIfNotExists("dnf", "마도학자", "class");
        insertIfNotExists("dnf", "인챈트리스", "class");
        insertIfNotExists("dnf", "크루세이더 (남)", "class");
        insertIfNotExists("dnf", "인파이터", "class");
        insertIfNotExists("dnf", "퇴마사", "class");
        insertIfNotExists("dnf", "어벤저", "class");
        insertIfNotExists("dnf", "크루세이더 (여)", "class");
        insertIfNotExists("dnf", "이단심판관", "class");
        insertIfNotExists("dnf", "무녀", "class");
        insertIfNotExists("dnf", "미스트리스", "class");
        insertIfNotExists("dnf", "로그", "class");
        insertIfNotExists("dnf", "사령술사", "class");
        insertIfNotExists("dnf", "쿠노이치", "class");
        insertIfNotExists("dnf", "섀도우댄서", "class");
        insertIfNotExists("dnf", "엘븐나이트", "class");
        insertIfNotExists("dnf", "카오스", "class");
        insertIfNotExists("dnf", "팔라딘", "class");
        insertIfNotExists("dnf", "드래곤나이트", "class");
        insertIfNotExists("dnf", "뱅가드", "class");
        insertIfNotExists("dnf", "듀얼리스트", "class");
        insertIfNotExists("dnf", "드래고니안 랜서", "class");
        insertIfNotExists("dnf", "다크 랜서", "class");
        insertIfNotExists("dnf", "히트맨", "class");
        insertIfNotExists("dnf", "요원", "class");
        insertIfNotExists("dnf", "트러블 슈터", "class");
        insertIfNotExists("dnf", "스페셜리스트", "class");
        insertIfNotExists("dnf", "뮤즈", "class");
        insertIfNotExists("dnf", "트래블러", "class");
        insertIfNotExists("dnf", "헌터", "class");
        insertIfNotExists("dnf", "비질란테", "class");
        insertIfNotExists("dnf", "키메라", "class");
        insertIfNotExists("dnf", "다크나이트", "class");
        insertIfNotExists("dnf", "크리에이터", "class");

        insertIfNotExists("dnf", "안톤", "Boss");
        insertIfNotExists("dnf", "견고한 다리", "Boss");
        insertIfNotExists("dnf", "검은 화산", "Boss");
        insertIfNotExists("dnf", "루크", "Boss");
        insertIfNotExists("dnf", "핀드워", "Boss");
        insertIfNotExists("dnf", "프레이", "Boss");
        insertIfNotExists("dnf", "이시스", "Boss");
        insertIfNotExists("dnf", "프레이-이시스", "Boss");
        insertIfNotExists("dnf", "시로코", "Boss");
        insertIfNotExists("dnf", "오즈마", "Boss");
        insertIfNotExists("dnf", "바칼", "Boss");
        insertIfNotExists("dnf", "기계 혁명", "Boss");
        insertIfNotExists("dnf", "아스라한", "Boss");
        insertIfNotExists("dnf", "안개의 신", "Boss");
        insertIfNotExists("dnf", "무", "Boss");
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
