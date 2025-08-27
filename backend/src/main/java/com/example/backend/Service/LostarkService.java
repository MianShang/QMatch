package com.example.backend.Service;

import com.example.backend.Config.LoaWebClientConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class LostarkService {

    private final LoaWebClientConfig loaWebClient;

    public Mono<Object> getProfile(String name) {
        return loaWebClient.get()
                .uri("/armories/characters/{name}/profiles", name)
                .retrieve()
                .bodyToMono(Object.class);
    }

}
