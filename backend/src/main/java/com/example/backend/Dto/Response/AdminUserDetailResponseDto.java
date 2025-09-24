package com.example.backend.Dto.Response;

import com.example.backend.Entity.User;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AdminUserDetailResponseDto {
    // 유저 기본 정보
    private String userId;
    private String userName;
    private String userEmail;
    private String status;

    // 참여중인 채팅방 목록
    private List<ChatRoomInfo> joinedChatRooms;

    // 연결된 게임 계정 (나중에 추가)
    // private List<GameAccountInfo> gameAccounts;


    // 엔티티를 DTO로 변환하는 정적 메서드
    public static AdminUserDetailResponseDto from(User user, List<ChatRoomInfo> chatRooms) {
        return AdminUserDetailResponseDto.builder()
                .userId(user.getUserId())
                .userName(user.getUserName())
                .userEmail(user.getUserEmail())
                .status(user.getStatus().getDescription())
                .joinedChatRooms(chatRooms)
                .build();
    }
}

