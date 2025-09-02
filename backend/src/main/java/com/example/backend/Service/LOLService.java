package com.example.backend.Service;

import com.example.backend.Config.RiotApiConfig;
import com.example.backend.Dto.LOLDto;
import com.example.backend.Service.LOLCacheService; // 캐시 서비스 import 추가
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.function.Function;
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
            System.out.println("📦 puuid: " + puuid);

            // Summoner API 호출 → summonerId, 레벨 획득
            String summonerUrl = "https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/" + puuid;
            ResponseEntity<String> summonerResponse = restTemplate.exchange(summonerUrl, HttpMethod.GET, entity, String.class);
            int level = JsonPath.read(summonerResponse.getBody(), "$.summonerLevel");
            dto.setLevel(level);

            System.out.println("📦 level: " + level);

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

                dto.setName(name + tag);
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

            // Match ID 목록 가져오기
            List<String> matchIds = getMatchIds(puuid, 30);

            // 모드별 챔피언 기록 초기화
            Map<String, List<String>> modeMap = new HashMap<>() {{
                put("solo", new ArrayList<>());
                put("flex", new ArrayList<>());
                put("normal", new ArrayList<>());
                put("aram", new ArrayList<>());
            }};

            // Match 상세 정보 분석 → 모드별 챔피언 기록 분류
            for (String matchId : matchIds) {
                String matchUrl = "https://asia.api.riotgames.com/lol/match/v5/matches/" + matchId;
                ResponseEntity<String> matchResponse = restTemplate.exchange(matchUrl, HttpMethod.GET, entity, String.class);
                if (!matchResponse.getStatusCode().is2xxSuccessful()) continue;

                String matchJson = matchResponse.getBody();

                int queueId = JsonPath.read(matchJson, "$.info.queueId");
                List<String> champList = JsonPath.read(matchJson, "$.info.participants[?(@.puuid=='" + puuid + "')].championName");

                if (champList.isEmpty()) continue;

                String champ = champList.get(0);

                switch (queueId) {
                    case 420 -> modeMap.get("solo").add(champ);
                    case 440 -> modeMap.get("flex").add(champ);
                    case 430 -> modeMap.get("normal").add(champ);
                    case 450 -> modeMap.get("aram").add(champ);
                }
            }

            // 모드별 모스트 3 챔피언 정리
            Map<String, List<Map<String, Object>>> mostMap = new HashMap<>();
            for (String mode : modeMap.keySet()) {
                mostMap.put(mode, getTop3(modeMap.get(mode)));
            }
            dto.setMost(mostMap);

            System.out.println("📦 mostMap: " + mostMap);

            // 캐시에 결과 저장
            cacheService.put(cacheKey, dto);

            return dto;

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Riot API 처리 중 오류 발생: " + e.getMessage());
        }
    }

    // 최근 matchId 30개 가져오기
    private List<String> getMatchIds(String puuid, int count) {
        try {
            String url = "https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/" + puuid + "/ids?start=0&count=" + count;
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Riot-Token", config.getApiKey());
            HttpEntity<String> entity = new HttpEntity<>(headers);
            String body = restTemplate.exchange(url, HttpMethod.GET, entity, String.class).getBody();
            return JsonPath.read(body, "$[*]");
        } catch (Exception e) {
            System.err.println("matchId 가져오기 실패: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    // 챔피언 리스트에서 모스트 3개 추출
    private List<Map<String, Object>> getTop3(List<String> list) {
        return list.stream()
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
                .entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(3)
                .map(e -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("championName", e.getKey());
                    m.put("count", e.getValue());
                    return m;
                })
                .collect(Collectors.toList());
    }
}
