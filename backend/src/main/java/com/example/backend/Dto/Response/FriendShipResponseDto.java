package com.example.backend.Dto.Response;

import com.example.backend.Entity.User;
import com.example.backend.Entity.UserStatus;
import lombok.*;

@Getter
@Setter
@EqualsAndHashCode(of = "userId")
public class FriendShipResponseDto {
    private String userId;
    private String userName;
    private String userProfile;
    private String status;

    public FriendShipResponseDto(User friendUser, String status) {
        this.userId = friendUser.getUserId();
        this.userName = friendUser.getUserName();
        this.userProfile = friendUser.getUserProfile();
        this.status = status;
    }
}
