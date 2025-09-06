package com.example.backend.presence;

import com.example.backend.Controller.UserStatusController;
import com.example.backend.Entity.UserStatus;
import com.example.backend.Repository.UserStatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@RequiredArgsConstructor
public class StompDisconnectListener implements ApplicationListener<SessionDisconnectEvent> {

    private final PresenceSessionRegistry registry;
    private final UserStatusRepository repo;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void onApplicationEvent(SessionDisconnectEvent event) {
        String userId = registry.remove(event.getSessionId());
        if (userId == null) return;

        UserStatus us = repo.findByUserId(userId).orElseGet(UserStatus::new);
        us.setUserId(userId);
        us.setStatus("오프라인");
        repo.save(us);

        messagingTemplate.convertAndSend("/topic/presence",
                new UserStatusController.PresenceEvent(userId, "오프라인", System.currentTimeMillis()));
    }
}
