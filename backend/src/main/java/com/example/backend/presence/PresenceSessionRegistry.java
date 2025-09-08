package com.example.backend.presence;

import org.springframework.stereotype.Component;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class PresenceSessionRegistry {

    // sessionId -> userId
    private final ConcurrentMap<String, String> sessionToUser = new ConcurrentHashMap<>();
    // userId -> active session count
    private final ConcurrentMap<String, AtomicInteger> userConnCount = new ConcurrentHashMap<>();

    public void put(String sessionId, String userId) {
        if (sessionId == null || userId == null) return;
        sessionToUser.put(sessionId, userId);
        userConnCount.compute(userId, (k, v) -> {
            if (v == null) return new AtomicInteger(1);
            v.incrementAndGet();
            return v;
        });
    }

    /** 세션 제거 후 (userId, 남은 세션 수) 반환 */
    public Result remove(String sessionId) {
        if (sessionId == null) return new Result(null, 0);
        String userId = sessionToUser.remove(sessionId);
        if (userId == null) return new Result(null, 0);

        int left = 0;
        AtomicInteger c = userConnCount.get(userId);
        if (c != null) {
            left = c.decrementAndGet();
            if (left <= 0) {
                userConnCount.remove(userId);
                left = 0;
            }
        }
        return new Result(userId, left);
    }

    public boolean isOnline(String userId) {
        AtomicInteger c = userConnCount.get(userId);
        return c != null && c.get() > 0;
    }

    public static class Result {
        public final String userId;
        public final int left;
        public Result(String userId, int left) {
            this.userId = userId;
            this.left = left;
        }
    }
}
