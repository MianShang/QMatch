package com.example.backend.Controller;

import com.example.backend.Dto.Request.UserStatusDto;
import com.example.backend.Entity.UserStatus;
import com.example.backend.Repository.UserStatusRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/user")
public class UserStatusController {

    private final UserStatusRepository repo;

    public UserStatusController(UserStatusRepository repo) {
        this.repo = repo;
    }

    @PostMapping("/status")
    @Transactional
    public ResponseEntity<Void> updateStatus(@RequestBody UserStatusDto dto) {
        UserStatus us = repo.findByUserId(dto.getUserId())
                .orElseGet(UserStatus::new);
        us.setUserId(dto.getUserId());
        us.setStatus(dto.getStatus());
        repo.save(us);
        return ResponseEntity.ok().build();
    }
}
