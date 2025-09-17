package com.example.backend.Config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class MapleApiConfig {

    @Value("${maple.api.key}")
    private String apiKey;

    @Bean
    public WebClient mapleWebClient(WebClient.Builder builder) {
        return builder
                .baseUrl("https://open.api.nexon.com")
                .defaultHeader("x-nxopen-api-key", apiKey)
                .build();
    }
}
