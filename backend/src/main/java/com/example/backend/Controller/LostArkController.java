package com.example.backend.Controller;

import com.example.backend.Service.LostarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/lostark")
@RequiredArgsConstructor
public class LostArkController {

    private final LostarkService lostarkservice;

   @GetMapping("/api/character/profile")
    public Mono<Object> profile(@RequestParam String name)
   {
        return lostarkservice.getProfile(name);
   }

}
