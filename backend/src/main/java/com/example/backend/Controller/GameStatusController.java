package com.example.backend.Controller;

import com.example.backend.Dto.GameStatusDto;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class GameStatusController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/status/games/{userId}")
    public void changeGameStatus(@DestinationVariable String userId, GameStatusDto payload)
    {
        System.out.println(userId+"현재상태, ");
        System.out.println(payload);

        messagingTemplate.convertAndSend("/topic/status/games", payload);
    }

}
