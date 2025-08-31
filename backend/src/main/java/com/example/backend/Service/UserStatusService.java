package com.example.backend.Service;

import com.example.backend.Dto.Request.UserStatusDto;
import com.example.backend.Entity.UserStatus;
import com.example.backend.Repository.UserStatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserStatusService {
    private final UserStatusRepository repo;

    @Transactional
    public void upsert(UserStatusDto dto) {
        UserStatus us = repo.findByUserId(dto.getUserId())
                .orElseGet(UserStatus::new);
        us.setUserId(dto.getUserId());
        us.setStatus(dto.getStatus());
        repo.save(us); // updatedAt 자동 갱신
    }
}
