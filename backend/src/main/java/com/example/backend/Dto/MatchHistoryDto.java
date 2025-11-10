package com.example.backend.Dto;

import lombok.Data;

@Data
public class MatchHistoryDto {
    // 챔피언 이름
    private String championName;
    
    // 승/패 (true: 승리, false: 패배)
    private boolean win;
    
    // KDA
    private int kills;
    private int deaths;
    private int assists;
    
    // 게임 모드 (예: 솔로랭크, 자유랭크, 일반, 칼바람)
    private String gameMode;
    
    // 게임 시간 (초)
    private long gameDuration;
    
    // 게임 시작 시간 (타임스탬프)
    private long gameStartTimestamp;
    
    // 큐 ID
    private int queueId;
}

