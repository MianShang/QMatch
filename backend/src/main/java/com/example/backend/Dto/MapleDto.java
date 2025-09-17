package com.example.backend.Dto;

import lombok.Data;
import java.util.List;

@Data
public class MapleDto {
    private String characterName;
    private String worldName;
    private int level;
    private String job;
    private String guildName;
    private String imageUrl;
    private List<Equipment> equipment;
    private String combatPower;   // 전투력

    @Data
    public static class Equipment {
        private String name;      // 아이템 이름
        private String type;      // 장비 분류
        private int starforce;    // 스타포스 개수
        private Integer scrollUpgrade; // 강화 수치
        private String iconUrl;

        // 잠재옵션
        private String potentialGrade;
        private String additionalPotentialGrade;
        private List<String> potential;
        private List<String> additionalPotential;

        // 주요 능력치
        private String str;
        private String dex;
        private String int_;
        private String luk;
        private String attackPower;
        private String magicPower;
        private String hp;
        private String mp;
        private String allStat;

        private String ignoreMonsterArmor; // 방무
        private String bossDamage;         // 보공

        // 세부 스탯
        private List<OptionDetail> optionDetails;

        @Data
        public static class OptionDetail {
            private String statName;
            private int base;
            private int add;
            private int enchant;
            private int starforce;
        }
    }
}
