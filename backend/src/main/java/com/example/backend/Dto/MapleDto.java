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

    @Data
    public static class Equipment {
        private String name;      // 아이템 이름
        private String type;      // 장비 부위
        private int starforce;    // 강화 수치
        private String iconUrl;   // 아이템 이미지
        private List<String> potential;          // 잠재옵션
        private List<String> additionalPotential; // 에디셔널 잠재옵션
    }
}
