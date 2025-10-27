package com.example.backend.presence;

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
        // 세션 제거: userId와 남은 세션 수를 함께 받음
        PresenceSessionRegistry.Result r = registry.remove(event.getSessionId());
        String userId = r.userId;
        if (userId == null) return;

        // 아직 이 사용자에 대한 다른 탭/세션이 살아 있으면 오프라인 처리하지 않음
        if (r.left > 0) return;

        // 마지막 세션이 끊겼으므로 DB 저장 + 브로드캐스트
        UserStatus us = repo.findByUserId(userId).orElseGet(UserStatus::new);
        us.setUserId(userId);
        us.setStatus("오프라인");
        repo.save(us);

        messagingTemplate.convertAndSend(
                "/topic/presence",
                new PresenceEvent(userId, "오프라인", System.currentTimeMillis())
        );

        // 친구목록이 구독하는 friends/status 토픽에도 같이 쏘기
        messagingTemplate.convertAndSend(
                "/topic/friends/status",
                java.util.Map.of("userId", userId, "status", "오프라인")
        );
    }
}
