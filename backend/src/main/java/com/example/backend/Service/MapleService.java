package com.example.backend.Service;

import com.example.backend.Dto.MapleDto;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MapleService {

    private final WebClient mapleWebClient;

    public MapleDto getCharacterInfo(String name) {
        String date = LocalDate.now().minusDays(1).toString();

        // 1. ocid 조회
        OcidResponse ocidResponse = mapleWebClient.get()
                .uri("/maplestory/v1/id?character_name={name}", name)
                .retrieve()
                .bodyToMono(OcidResponse.class)
                .block();

        if (ocidResponse == null || ocidResponse.getOcid() == null) {
            throw new RuntimeException("❌ ocid 조회 실패: " + name);
        }
        String ocid = ocidResponse.getOcid();

        // 2. 기본 정보
        CharacterBasicResponse basic = mapleWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/maplestory/v1/character/basic")
                        .queryParam("ocid", ocid)
                        .queryParam("date", date)
                        .build())
                .retrieve()
                .bodyToMono(CharacterBasicResponse.class)
                .block();

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

    // ---------------- Response ----------------
    @lombok.Data
    static class OcidResponse {
        private String ocid;
    }

    @lombok.Data
    static class CharacterBasicResponse {
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
            @JsonProperty("scroll_upgrade")
            private Integer scrollUpgrade;
            @JsonProperty("item_icon")
            private String itemIcon;

            // ⭐ 잠재옵션 등급
            @JsonProperty("potential_option_grade")
            private String potentialGrade;
            @JsonProperty("additional_potential_option_grade")
            private String addPotentialGrade;

            // ⭐ 잠재옵션 내용
            @JsonProperty("potential_option_1")
            private String potential1;
            @JsonProperty("potential_option_2")
            private String potential2;
            @JsonProperty("potential_option_3")
            private String potential3;

            @JsonProperty("additional_potential_option_1")
            private String addPotential1;
            @JsonProperty("additional_potential_option_2")
            private String addPotential2;
            @JsonProperty("additional_potential_option_3")
            private String addPotential3;

            // 옵션
            @JsonProperty("item_total_option")
            private TotalOption totalOption;
            @JsonProperty("item_base_option")
            private TotalOption baseOption;
            @JsonProperty("item_add_option")
            private TotalOption addOption;
            @JsonProperty("item_exceptional_option")
            private TotalOption enchantOption;
            @JsonProperty("item_starforce_option")
            private TotalOption starforceOption;
        }

        @lombok.Data
        static class TotalOption {
            @JsonProperty("str") private String str;
            @JsonProperty("dex") private String dex;
            @JsonProperty("int") private String int_;
            @JsonProperty("luk") private String luk;
            @JsonProperty("attack_power") private String attackPower;
            @JsonProperty("magic_power") private String magicPower;
            @JsonProperty("max_hp") private String hp;
            @JsonProperty("max_mp") private String mp;
            @JsonProperty("all_stat") private String allStat;
            @JsonProperty("ignore_monster_armor") private String ignoreMonsterArmor;
            @JsonProperty("boss_damage") private String bossDamage;
        }

        public List<MapleDto.Equipment> toEquipmentList() {
            if (itemEquipment == null) return List.of();
            return itemEquipment.stream().map(i -> {
                MapleDto.Equipment e = new MapleDto.Equipment();
                e.setName(i.getItemName());
                e.setType(i.getItemEquipmentSlot());
                e.setStarforce(i.getStarforce());
                e.setScrollUpgrade(i.getScrollUpgrade());
                e.setIconUrl(i.getItemIcon());

                // ⭐ 잠재옵션 등급 전달
                e.setPotentialGrade(i.getPotentialGrade());
                e.setAdditionalPotentialGrade(i.getAddPotentialGrade());

                // ⭐ 잠재옵션 내용 전달
                List<String> potential = new ArrayList<>();
                if (i.getPotential1() != null) potential.add(i.getPotential1());
                if (i.getPotential2() != null) potential.add(i.getPotential2());
                if (i.getPotential3() != null) potential.add(i.getPotential3());
                e.setPotential(potential);

                List<String> addPotential = new ArrayList<>();
                if (i.getAddPotential1() != null) addPotential.add(i.getAddPotential1());
                if (i.getAddPotential2() != null) addPotential.add(i.getAddPotential2());
                if (i.getAddPotential3() != null) addPotential.add(i.getAddPotential3());
                e.setAdditionalPotential(addPotential);

                if (i.getTotalOption() != null) {
                    e.setStr(i.getTotalOption().getStr());
                    e.setDex(i.getTotalOption().getDex());
                    e.setInt_(i.getTotalOption().getInt_());
                    e.setLuk(i.getTotalOption().getLuk());
                    e.setAttackPower(i.getTotalOption().getAttackPower());
                    e.setMagicPower(i.getTotalOption().getMagicPower());
                    e.setHp(i.getTotalOption().getHp());
                    e.setMp(i.getTotalOption().getMp());
                    e.setAllStat(i.getTotalOption().getAllStat());
                    e.setIgnoreMonsterArmor(i.getTotalOption().getIgnoreMonsterArmor());
                    e.setBossDamage(i.getTotalOption().getBossDamage());
                }

                List<MapleDto.Equipment.OptionDetail> optionDetails = new ArrayList<>();
                optionDetails.add(buildOptionDetail("STR", i));
                optionDetails.add(buildOptionDetail("DEX", i));
                optionDetails.add(buildOptionDetail("INT", i));
                optionDetails.add(buildOptionDetail("LUK", i));
                optionDetails.add(buildOptionDetail("공격력", i));
                optionDetails.add(buildOptionDetail("마력", i));
                optionDetails.add(buildOptionDetail("HP", i));
                optionDetails.add(buildOptionDetail("MP", i));
                optionDetails.add(buildOptionDetail("올스탯", i));

                e.setOptionDetails(optionDetails);
                return e;
            }).toList();
        }

        private MapleDto.Equipment.OptionDetail buildOptionDetail(String stat, Item i) {
            MapleDto.Equipment.OptionDetail d = new MapleDto.Equipment.OptionDetail();
            d.setStatName(stat);
            d.setBase(getValue(i.getBaseOption(), stat));
            d.setAdd(getValue(i.getAddOption(), stat));
            d.setEnchant(getValue(i.getEnchantOption(), stat));
            d.setStarforce(getValue(i.getStarforceOption(), stat));
            return d;
        }

        private int getValue(TotalOption option, String stat) {
            if (option == null) return 0;
            return switch (stat) {
                case "STR" -> parse(option.getStr());
                case "DEX" -> parse(option.getDex());
                case "INT" -> parse(option.getInt_());
                case "LUK" -> parse(option.getLuk());
                case "공격력" -> parse(option.getAttackPower());
                case "마력" -> parse(option.getMagicPower());
                case "HP" -> parse(option.getHp());
                case "MP" -> parse(option.getMp());
                case "올스탯" -> parse(option.getAllStat());
                default -> 0;
            };
        }

        private int parse(String val) {
            try {
                return val == null ? 0 : Integer.parseInt(val);
            } catch (NumberFormatException e) {
                return 0;
            }
        }
    }
}
