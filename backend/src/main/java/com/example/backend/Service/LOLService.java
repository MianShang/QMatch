package com.example.backend.Service;

import com.example.backend.Config.RiotApiConfig;
import com.example.backend.Dto.LOLDto;
import com.example.backend.Dto.ChampionMasteryDto;
import com.example.backend.Dto.MatchHistoryDto;
import com.example.backend.Service.LOLCacheService; // 캐시 서비스 import 추가
import com.jayway.jsonpath.JsonPath;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LOLService {
    private final RiotApiConfig config;
    private final RestTemplate restTemplate = new RestTemplate();
    private final LOLCacheService cacheService;

    // 게임 닉네임+태그로 전체 전적 정보 가져오기
    public LOLDto getFullRiotStats(String name, String tag) {
        System.out.println("name: " + name);

        // 동일한 name+tag 조합이 있으면 API 호출 생략
        String cacheKey = name + "#" + tag;
        LOLDto cached = cacheService.get(cacheKey);
        if (cached != null) {
            return cached;
        }

        LOLDto dto = new LOLDto();

        try {
            // Account API 호출 → PUUID 획득
            String accountUrl = "https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/" + name + "/" + tag;
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Riot-Token", config.getApiKey());
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> accountResponse = restTemplate.exchange(accountUrl, HttpMethod.GET, entity, String.class);
            if (!accountResponse.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Account API 응답 실패");
            }

            String puuid = JsonPath.read(accountResponse.getBody(), "$.puuid");
            System.out.println("puuid: " + puuid);

            // Summoner API 호출 → summonerId, 레벨 획득
            String summonerUrl = "https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/" + puuid;
            ResponseEntity<String> summonerResponse = restTemplate.exchange(summonerUrl, HttpMethod.GET, entity, String.class);
            int level = JsonPath.read(summonerResponse.getBody(), "$.summonerLevel");
            dto.setLevel(level);

            System.out.println("level: " + level);

            // League API 호출 → 티어/랭크/LP/승패/승률 획득
            String tierUrl = "https://kr.api.riotgames.com/lol/league/v4/entries/by-puuid/" + puuid;
            ResponseEntity<String> tierResponse = restTemplate.exchange(tierUrl, HttpMethod.GET, entity, String.class);
            List<Map<String, Object>> tierList = JsonPath.parse(tierResponse.getBody())
                    .read("$[?(@.queueType == 'RANKED_SOLO_5x5')]");

            if (!tierList.isEmpty()) {
                Map<String, Object> tier = tierList.get(0);
                int wins = (int) tier.get("wins");
                int losses = (int) tier.get("losses");
                double winRate = wins + losses > 0 ? wins * 100.0 / (wins + losses) : 0;

                dto.setName(name + "#" + tag);
                dto.setTier((String) tier.get("tier"));
                dto.setRank((String) tier.get("rank"));
                dto.setLp((int) tier.get("leaguePoints"));
                dto.setWins(wins);
                dto.setLosses(losses);
                dto.setWinRate(String.format("%.1f", winRate));

                System.out.println("이름" +  dto.getName() + "티어: " + tier.get("tier") + " " + tier.get("rank") + " (" + tier.get("leaguePoints") + " LP)");
            } else {
                // 랭크 전적이 없는 경우 기본값 세팅
                dto.setName(name + "#" + tag);
                dto.setTier("UNRANKED");
                dto.setRank("-");
                dto.setLp(0);
                dto.setWins(0);
                dto.setLosses(0);
                dto.setWinRate("-");
            }

            // 4. Champion Mastery API → 숙련도 상위 3 챔피언
            String masteryUrl = "https://kr.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/" + puuid;
            ResponseEntity<String> masteryResponse = restTemplate.exchange(masteryUrl, HttpMethod.GET, entity, String.class);

            List<Map<String, Object>> masteryList = JsonPath.parse(masteryResponse.getBody())
                    .read("$[0:3]"); // 상위 3개만

            // ChampionMasteryDto로 변환
            List<ChampionMasteryDto> masteryDtos = masteryList.stream().map(m -> {
                ChampionMasteryDto dtoObj = new ChampionMasteryDto();
                dtoObj.setChampionId(((Number) m.get("championId")).intValue());
                dtoObj.setChampionLevel(((Number) m.get("championLevel")).intValue());
                dtoObj.setChampionPoints(((Number) m.get("championPoints")).intValue());
                dtoObj.setLastPlayTime(((Number) m.get("lastPlayTime")).longValue());
                dtoObj.setChestGranted(Boolean.TRUE.equals(m.get("chestGranted")));

                Object tokenObj = m.get("tokensEarned");
                dtoObj.setTokensEarned(tokenObj instanceof Number ? ((Number) tokenObj).intValue() : 0);

                return dtoObj;
            }).toList();

            dto.setChampionMasteries(masteryDtos);

            // 매치 히스토리 가져오기 (최근 10게임)
            List<String> matchIds = getMatchIds(puuid, 10);
            System.out.println("매치 ID 개수: " + (matchIds != null ? matchIds.size() : 0));
            List<MatchHistoryDto> matchHistoryList = new ArrayList<>();

            for (String matchId : matchIds) {
                try {
                    String matchUrl = "https://asia.api.riotgames.com/lol/match/v5/matches/" + matchId;
                    ResponseEntity<String> matchResponse = restTemplate.exchange(matchUrl, HttpMethod.GET, entity, String.class);
                    if (!matchResponse.getStatusCode().is2xxSuccessful()) continue;

                    String matchJson = matchResponse.getBody();
                    if (matchJson == null || matchJson.isEmpty()) {
                        System.err.println("매치 JSON이 비어있음: " + matchId);
                        continue;
                    }
                    
                    // 해당 유저의 참가자 정보 찾기
                    List<Map<String, Object>> participants = JsonPath.read(matchJson, "$.info.participants[?(@.puuid=='" + puuid + "')]");
                    if (participants == null || participants.isEmpty()) {
                        System.err.println("참가자 정보를 찾을 수 없음: " + matchId);
                        continue;
                    }
                    
                    Map<String, Object> participant = participants.get(0);
                    if (participant == null) {
                        System.err.println("참가자 정보가 null: " + matchId);
                        continue;
                    }
                    
                    MatchHistoryDto matchHistory = new MatchHistoryDto();
                    
                    // 챔피언 이름
                    Object champNameObj = participant.get("championName");
                    matchHistory.setChampionName(champNameObj != null ? champNameObj.toString() : "Unknown");
                    
                    // 승/패
                    Object winObj = participant.get("win");
                    matchHistory.setWin(winObj instanceof Boolean ? (Boolean) winObj : Boolean.TRUE.equals(winObj));
                    
                    // KDA
                    Object killsObj = participant.get("kills");
                    matchHistory.setKills(killsObj instanceof Number ? ((Number) killsObj).intValue() : 0);
                    
                    Object deathsObj = participant.get("deaths");
                    matchHistory.setDeaths(deathsObj instanceof Number ? ((Number) deathsObj).intValue() : 0);
                    
                    Object assistsObj = participant.get("assists");
                    matchHistory.setAssists(assistsObj instanceof Number ? ((Number) assistsObj).intValue() : 0);
                    
                    Object queueIdObj = JsonPath.read(matchJson, "$.info.queueId");
                    int queueId = queueIdObj instanceof Number ? ((Number) queueIdObj).intValue() : 0;
                    matchHistory.setQueueId(queueId);
                    
                    // 큐 ID를 게임 모드로 변환
                    String gameMode = getGameMode(queueId);
                    matchHistory.setGameMode(gameMode);
                    
                    // gameDuration과 gameStartTimestamp는 Integer 또는 Long일 수 있으므로 Number로 처리
                    Object gameDurationObj = JsonPath.read(matchJson, "$.info.gameDuration");
                    long gameDuration = gameDurationObj instanceof Number ? ((Number) gameDurationObj).longValue() : 0L;
                    matchHistory.setGameDuration(gameDuration);
                    
                    Object gameStartTimestampObj = JsonPath.read(matchJson, "$.info.gameStartTimestamp");
                    long gameStartTimestamp = gameStartTimestampObj instanceof Number ? ((Number) gameStartTimestampObj).longValue() : 0L;
                    matchHistory.setGameStartTimestamp(gameStartTimestamp);
                    
                    matchHistoryList.add(matchHistory);
                } catch (Exception e) {
                    System.err.println("매치 정보 가져오기 실패: " + matchId + " - " + e.getMessage());
                    e.printStackTrace();
                    continue;
                }
            }
            
            System.out.println("최종 매치 히스토리 개수: " + matchHistoryList.size());
            dto.setMatchHistory(matchHistoryList);

            // 캐시에 결과 저장
            cacheService.put(cacheKey, dto);

            return dto;

        } catch (Exception e) {
            throw new RuntimeException("Riot API 처리 중 오류 발생: " + e.getMessage());
        }
    }

    // 최근 matchId 가져오기 (최대 10개)
    private List<String> getMatchIds(String puuid, int count) {
        try {
            String url = "https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/" + puuid + "/ids?start=0&count=" + count;
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Riot-Token", config.getApiKey());
            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            
            if (!response.getStatusCode().is2xxSuccessful()) {
                System.err.println("매치 ID API 응답 실패: " + response.getStatusCode());
                return Collections.emptyList();
            }
            
            String body = response.getBody();
            if (body == null || body.isEmpty()) {
                System.err.println("매치 ID 응답 본문이 비어있음");
                return Collections.emptyList();
            }
            
            List<String> matchIds = JsonPath.read(body, "$[*]");
            return matchIds != null ? matchIds : Collections.emptyList();
        } catch (Exception e) {
            System.err.println("matchId 가져오기 실패: " + e.getMessage());
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    // 큐 ID를 게임 모드로 변환
    private String getGameMode(int queueId) {
        return switch (queueId) {
            case 420 -> "솔로랭크";
            case 440 -> "자유랭크";
            case 430 -> "일반";
            case 450 -> "칼바람";
            case 700 -> "격전";
            case 1700 -> "아레나";
            default -> "기타";
        };
    }
}
