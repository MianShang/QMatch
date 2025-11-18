package com.example.backend.Dto.Response;

import com.example.backend.Entity.User;
import lombok.*;

@Getter
@Setter
@EqualsAndHashCode(of = "userId")
public class FriendShipResponseDto {
    private String userId;
    private String userName;
    private String userNickname;
    private String userProfile;
    private String status;

    public FriendShipResponseDto(User friendUser, String status) {
        this.userId = friendUser.getUserId();
        this.userName = friendUser.getUserName();
        this.userNickname = friendUser.getUserNickName();
        this.userProfile = friendUser.getUserProfile();
        this.status = status;
    }

    public FriendShipResponseDto(User friendUser)
    {
        this.userId = friendUser.getUserId();
        this.userName = friendUser.getUserName();
        this.userNickname = friendUser.getUserNickName();
        this.userProfile = friendUser.getUserProfile();
        this.status = "null";
    }
}
