package com.example.backend.Service;

import com.example.backend.Dto.MapleDto;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MapleService {

    private final WebClient mapleWebClient;

    // 닉네임으로 캐릭터 전체 정보 조회
    public MapleDto getCharacterInfo(String name) {
        // API는 오늘 데이터가 없을 수 있으므로 "어제 날짜"로 요청
        String date = LocalDate.now().minusDays(1).toString();
        System.out.println("메이플 API 조회 시작 - 닉네임: " + name + " / date=" + date);

        // 1. ocid 조회
        OcidResponse ocidResponse = mapleWebClient.get()
                .uri("/maplestory/v1/id?character_name={name}", name)
                .retrieve()
                .bodyToMono(OcidResponse.class)
                .block();

        if (ocidResponse == null || ocidResponse.getOcid() == null) {
            System.out.println("❌ ocid 조회 실패 - 닉네임: " + name);
            throw new RuntimeException("ocid 조회 실패: " + name);
        }

        String ocid = ocidResponse.getOcid();
        System.out.println("✅ ocid 조회 성공 - ocid: " + ocid);

        // 2. 캐릭터 기본 정보
        CharacterBasicResponse basic = mapleWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/maplestory/v1/character/basic")
                        .queryParam("ocid", ocid)
                        .queryParam("date", date)
                        .build())
                .retrieve()
                .bodyToMono(CharacterBasicResponse.class)
                .block();

        if (basic == null) {
            System.out.println("❌ 캐릭터 기본 정보 조회 실패 - ocid: " + ocid);
            throw new RuntimeException("캐릭터 기본 정보 조회 실패");
        }

        System.out.println("✅ 캐릭터 기본 정보 조회 성공 - 닉네임: " + basic.getCharacterName());

        // 3. 장비 정보
        CharacterEquipmentResponse equip = mapleWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/maplestory/v1/character/item-equipment")
                        .queryParam("ocid", ocid)
                        .queryParam("date", date)
                        .build())
                .retrieve()
                .bodyToMono(CharacterEquipmentResponse.class)
                .block();

        if (equip == null) {
            System.out.println("❌ 장비 정보 조회 실패 - ocid: " + ocid);
            throw new RuntimeException("장비 정보 조회 실패");
        }

        System.out.println("✅ 장비 정보 조회 성공 - 장비 개수: " +
                (equip.getItemEquipment() != null ? equip.getItemEquipment().size() : 0));

        // DTO 변환
        MapleDto dto = new MapleDto();
        dto.setCharacterName(basic.getCharacterName());
        dto.setWorldName(basic.getWorldName());
        dto.setLevel(basic.getCharacterLevel());
        dto.setJob(basic.getCharacterJobName());
        dto.setGuildName(basic.getCharacterGuildName());
        dto.setImageUrl(basic.getCharacterImage());
        dto.setEquipment(equip.toEquipmentList());

        return dto;
    }

    // ---------------- Response Classes ----------------

    @lombok.Data
    static class OcidResponse {
        private String ocid;
    }

    @lombok.Data
    static class CharacterBasicResponse {
        private String date;

        @JsonProperty("character_name")
        private String characterName;

        @JsonProperty("world_name")
        private String worldName;

        @JsonProperty("character_level")
        private int characterLevel;

        @JsonProperty("character_class")
        private String characterJobName;

        @JsonProperty("character_guild_name")
        private String characterGuildName;

        @JsonProperty("character_image")
        private String characterImage;
    }

    @lombok.Data
    static class CharacterEquipmentResponse {
        @JsonProperty("item_equipment")
        private List<Item> itemEquipment;

        @lombok.Data
        static class Item {
            @JsonProperty("item_name")
            private String itemName;

            @JsonProperty("item_equipment_slot")
            private String itemEquipmentSlot;

            private int starforce;

            @JsonProperty("item_icon")
            private String itemIcon;

            @JsonProperty("potential_option")
            private List<String> potentialOption;

            @JsonProperty("additional_potential_option")
            private List<String> additionalPotentialOption;
        }

        public List<MapleDto.Equipment> toEquipmentList() {
            if (itemEquipment == null) return List.of();
            return itemEquipment.stream().map(i -> {
                MapleDto.Equipment e = new MapleDto.Equipment();
                e.setName(i.getItemName());
                e.setType(i.getItemEquipmentSlot());
                e.setStarforce(i.getStarforce());
                e.setIconUrl(i.getItemIcon());
                e.setPotential(i.getPotentialOption());
                e.setAdditionalPotential(i.getAdditionalPotentialOption());
                return e;
            }).toList();
        }
    }
}
