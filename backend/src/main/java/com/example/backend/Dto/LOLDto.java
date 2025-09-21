package com.example.backend.Dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class LOLDto {

    // 닉네임
    private String name;

    // 티어 (예: GOLD, PLATINUM 등)
    private String tier;

    // 세부 랭크 (예: I, II, III, IV)
    private String rank;

    // 현재 리그 포인트 (LP)
    private int lp;

    // 소환사 레벨
    private int level;

    // 랭크 승 수
    private int wins;

    // 링크 패 수
    private int losses;

    // 승률 (소수점 포함 퍼센트 문자열로 반환됨)
    private String winRate;

    // 숙련도 데이터 (챔피언 상위 3개)
    private List<Map<String, Object>> championMastery;

    // 숙련도 TOP3
    private List<ChampionMasteryDto> championMasteries;

    // 큐 타입별 모스트 챔피언 정보
    // private Map<String, List<Map<String, Object>>> most; // solo, flex, normal, aram 별 챔피언 리스트
}
