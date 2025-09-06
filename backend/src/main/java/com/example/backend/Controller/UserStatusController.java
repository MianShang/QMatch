package com.example.backend.Controller;

import com.example.backend.Dto.Request.UserStatusDto;
import com.example.backend.Entity.UserStatus;
import com.example.backend.Repository.UserStatusRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*; // List, Map, HashMap, ArrayList
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
public class UserStatusController {

    private final UserStatusRepository repo;
    private final SimpMessagingTemplate messagingTemplate;

    public UserStatusController(UserStatusRepository repo,
                                SimpMessagingTemplate messagingTemplate) {
        this.repo = repo;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * 상태 업서트 + 변경 시 presence 브로드캐스트
     */
    @PostMapping("/status")
    @Transactional
    public ResponseEntity<Void> updateStatus(@RequestBody UserStatusDto dto) {
        UserStatus us = repo.findByUserId(dto.getUserId())
                .orElseGet(UserStatus::new);
        String prev = us.getStatus();

        us.setUserId(dto.getUserId());
        us.setStatus(dto.getStatus());
        repo.save(us);

        // 변경시에만 브로드캐스트
        if (!Objects.equals(prev, dto.getStatus())) {
            PresenceEvent payload = new PresenceEvent(dto.getUserId(), dto.getStatus(), System.currentTimeMillis());
            messagingTemplate.convertAndSend("/topic/presence", payload);
        }
        return ResponseEntity.ok().build();
    }

    /**
     * 초기 스냅샷: 참여자 사용자들의 현재 상태를 일괄 조회
     * - 지원 형식: /status/batch?ids=a&ids=b  (반복 파라미터)
     *             /status/batch?ids=a,b      (콤마 구분)
     */
    @GetMapping("/status/batch")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, String>> getStatuses(@RequestParam("ids") List<String> idsRaw) {
        // 반복 파라미터/콤마 혼용 안정 처리
        List<String> ids = new ArrayList<>();
        for (String s : idsRaw) {
            if (s == null) continue;
            for (String t : s.split(",")) {
                String v = t.trim();
                if (!v.isEmpty()) ids.add(v);
            }
        }
        // 중복 제거
        ids = ids.stream().distinct().collect(Collectors.toList());

        Map<String, String> map = new HashMap<>();
        if (!ids.isEmpty()) {
            repo.findAllByUserIdIn(ids).forEach(us ->
                    map.put(us.getUserId(), us.getStatus() == null ? "오프라인" : us.getStatus())
            );
            // DB에 없으면 오프라인으로 간주
            for (String id : ids) {
                map.putIfAbsent(id, "오프라인");
            }
        }
        return ResponseEntity.ok(map);
    }

    // STOMP로 내보낼 페이로드
    public static class PresenceEvent {
        private String userId;
        private String status;
        private long ts;

        public PresenceEvent() { }
        public PresenceEvent(String userId, String status, long ts) {
            this.userId = userId;
            this.status = status;
            this.ts = ts;
        }
        public String getUserId() { return userId; }
        public String getStatus() { return status; }
        public long getTs() { return ts; }
    }
}
