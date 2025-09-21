package com.example.backend.Repository;

import com.example.backend.Entity.ChatRoom;
import com.example.backend.Entity.User;
import com.example.backend.Entity.UserChatRoom;
import com.example.backend.enums.ChatRoomUserStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserChatRoomRepository extends JpaRepository<UserChatRoom, Long> {

    // 유저, 채팅방 두개를 인자로 받아 두개에 해당하는 하나의 컬럼 찾음
    Optional<UserChatRoom> findByUserAndChatRoom(User user, ChatRoom chatRoom);

    // userId를 인자로 받아 컬럼 검색
    List<UserChatRoom> findByUser_UserId(String userId);

    // 채팅방 아이디로 채팅방 컬럼 가져오기
    List<UserChatRoom> findByChatRoom_Id(String roomId);

    // 추방
    long deleteByUser_UserIdAndChatRoom_Id(String userId, String roomId);

    // 참여되어 있는지 확인
    boolean existsByUser_UserIdAndChatRoom_Id(String userId, String roomId);

    // 방장 넘기기에 필요 → 특정 유저 / 방 매핑 가져오기
    Optional<UserChatRoom> findByUser_UserIdAndChatRoom_Id(String userId, String roomId);

    // 입장 수락, 거절
    List<UserChatRoom> findByChatRoomAndStatus(ChatRoom chatRoom, ChatRoomUserStatus status);
    
    // 채팅방 ID와 상태로 입장 신청 목록 조회
    List<UserChatRoom> findByChatRoom_IdAndStatus(String roomId, ChatRoomUserStatus status);

    // 방 삭제에 필요 → 채팅방에 속한 모든 매핑 삭제
    void deleteByChatRoom_Id(String roomId);
    
    // 특정 유저와 채팅방의 PENDING 상태 UserChatRoom 찾기
    Optional<UserChatRoom> findByUser_UserIdAndChatRoom_IdAndStatus(String userId, String roomId, ChatRoomUserStatus status);
    
    // 특정 유저의 특정 상태 채팅방 목록 조회
    List<UserChatRoom> findByUser_UserIdAndStatus(String userId, ChatRoomUserStatus status);
}
