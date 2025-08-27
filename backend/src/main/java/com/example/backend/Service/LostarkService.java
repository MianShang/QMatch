package com.example.backend.Service;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class LostarkService {

    private final WebClient lostarkWebClient;

    public Mono<Object> getProfile(String name) {
        return lostarkWebClient.get()
                .uri("/armories/characters/{name}/profiles", name)
                .retrieve()
                .bodyToMono(Object.class);
    }

}
