package com.example.backend.enums;


public enum FriendShipStatus {
        PENDING,    //요청 대기 중
        ACCEPTED,   //친구 수락
        REJECTED,   //친구 요청 거절
        BLOCKED,    //단방향 사용자 차단
        BLOCKS      //양방향 사용자 차단
}
