package com.example.backend.presence;

import org.springframework.stereotype.Component;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Component
public class PresenceSessionRegistry {
    private final ConcurrentMap<String, String> sessionToUser = new ConcurrentHashMap<>();
    public void put(String sessionId, String userId) { if (sessionId!=null && userId!=null) sessionToUser.put(sessionId, userId); }
    public String remove(String sessionId) { return sessionToUser.remove(sessionId); }
}
