package com.example.backend.Dto;

import lombok.Data;

@Data
public class ChampionMasteryDto {
    private int championId;
    private int championLevel;
    private int championPoints;
    private long lastPlayTime;
    private boolean chestGranted;
    private int tokensEarned;
}
