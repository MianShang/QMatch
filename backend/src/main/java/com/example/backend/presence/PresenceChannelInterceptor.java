package com.example.backend.presence;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.*;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PresenceChannelInterceptor implements ChannelInterceptor {
    private final PresenceSessionRegistry registry;
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor acc = StompHeaderAccessor.wrap(message);
        if (acc.getCommand() == StompCommand.CONNECT) {
            String userId = acc.getFirstNativeHeader("userId");
            registry.put(acc.getSessionId(), userId);
        }
        return message;
    }
}
