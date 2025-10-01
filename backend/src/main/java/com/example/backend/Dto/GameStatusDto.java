package com.example.backend.Dto;

import lombok.Data;

import java.util.List;

@Data
public class GameStatusDto {

    private String userId;
    private List<String> runningGames;

}
