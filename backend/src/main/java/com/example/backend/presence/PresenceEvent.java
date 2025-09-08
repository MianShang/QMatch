package com.example.backend.presence;

public class PresenceEvent {
    private String userId;
    private String status;
    private long ts;

    public PresenceEvent() {}
    public PresenceEvent(String userId, String status, long ts) {
        this.userId = userId;
        this.status = status;
        this.ts = ts;
    }
    public String getUserId() { return userId; }
    public String getStatus() { return status; }
    public long getTs() { return ts; }
}
