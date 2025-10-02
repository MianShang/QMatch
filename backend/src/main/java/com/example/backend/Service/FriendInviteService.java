package com.example.backend.Service;

import com.example.backend.Entity.ChatRoom;
import com.example.backend.Entity.User;
import com.example.backend.Entity.UserChatRoom;
import com.example.backend.Entity.Role;
import com.example.backend.enums.ChatRoomUserStatus;
import com.example.backend.Repository.ChatRoomRepository;
import com.example.backend.Repository.UserChatRoomRepository;
import com.example.backend.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class FriendInviteService {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;
    private final UserChatRoomRepository userChatRoomRepository;

    // 친구 초대 전송
    @Transactional
    public void sendFriendInvite(String roomId, String roomName, String inviterId, 
                               String inviterName, String friendId, String friendName) {
        
        // 1. 채팅방 존재 확인
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));
        
        // 2. 초대자가 방에 참여 중인지 확인
        boolean isInviterInRoom = userChatRoomRepository
                .findByUser_UserIdAndChatRoom_IdAndStatus(inviterId, roomId, ChatRoomUserStatus.ACCEPTED)
                .isPresent();
        
        if (!isInviterInRoom) {
            throw new IllegalArgumentException("방에 참여 중인 멤버만 친구를 초대할 수 있습니다.");
        }
        
        // 3. 친구 존재 확인
        User friend = userRepository.findByUserId(friendId)
                .orElseThrow(() -> new IllegalArgumentException("친구를 찾을 수 없습니다."));
        
        // 4. 친구가 이미 방에 있는지 확인
        boolean isAlreadyInRoom = userChatRoomRepository
                .findByUser_UserIdAndChatRoom_IdAndStatus(friendId, roomId, ChatRoomUserStatus.ACCEPTED)
                .isPresent();
        
        if (isAlreadyInRoom) {
            throw new IllegalArgumentException("이미 방에 참여 중인 친구입니다.");
        }
        
        // 5. 친구에게 초대 알림 전송
        // 태그 이름들을 문자열 배열로 변환
        var tagNames = room.getChatRoomTags().stream()
                .map(ct -> ct.getGameTag() != null ? ct.getGameTag().getTagName() : null)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        
        // 초대자 정보 가져오기
        User inviter = userRepository.findByUserId(inviterId)
                .orElseThrow(() -> new IllegalArgumentException("초대자를 찾을 수 없습니다."));
        
        Map<String, Object> inviteData = Map.of(
                "roomId", roomId,
                "roomName", roomName,
                "gameName", room.getGameName(),
                "tagNames", tagNames,
                "inviterName", inviterName,
                "inviterId", inviterId,
                "inviterProfileImage", inviter.getUserProfile() != null ? inviter.getUserProfile() : "",
                "userId", friendId
        );
        
        messagingTemplate.convertAndSend("/topic/user/" + friendId + "/friend-invite", inviteData);
    }

    // 친구 초대 수락
    @Transactional
    public void acceptFriendInvite(String roomId, String userId) {
        
        // 1. 채팅방 존재 확인
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));
        
        // 2. 사용자 존재 확인
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        
        // 3. 이미 방에 있는지 확인
        boolean isAlreadyInRoom = userChatRoomRepository
                .findByUser_UserIdAndChatRoom_IdAndStatus(userId, roomId, ChatRoomUserStatus.ACCEPTED)
                .isPresent();
        
        if (isAlreadyInRoom) {
            throw new IllegalArgumentException("이미 방에 참여 중입니다.");
        }
        
        // 4. 방 인원수 확인 (실제 DB 상태 기반)
        long currentUsers = userChatRoomRepository.findByChatRoom_IdAndStatus(roomId, ChatRoomUserStatus.ACCEPTED).size();
        if (currentUsers >= room.getMaxUsers()) {
            throw new IllegalArgumentException("방이 가득 찼습니다.");
        }
        
        // 5. 사용자를 방에 추가
        UserChatRoom userChatRoom = new UserChatRoom(user, room, Role.MEMBER);
        userChatRoom.setStatus(ChatRoomUserStatus.ACCEPTED);
        userChatRoomRepository.save(userChatRoom);
        
        // 6. 채팅방 현재 인원 수 증가
        room.setCurrentUsers(room.getCurrentUsers() + 1);
        chatRoomRepository.save(room);
        
        // 7. 방장에게 수락 알림 전송
        Map<String, Object> responseData = Map.of(
                "type", "accepted",
                "friendName", user.getUserName(),
                "roomId", roomId
        );
        
        messagingTemplate.convertAndSend("/topic/user/" + room.getOwner().getUserId() + "/friend-invite-response", responseData);
        
        // 8. 방 참여자들에게 새 멤버 입장 알림
        Map<String, Object> joinData = Map.of(
                "userId", userId,
                "userName", user.getUserName(),
                "roomId", roomId
        );
        
        messagingTemplate.convertAndSend("/topic/chat/" + roomId + "/member-joined", joinData);
    }

    // 친구 초대 거절
    @Transactional
    public void rejectFriendInvite(String roomId, String userId, boolean isAutoReject) {
        
        // 1. 채팅방 존재 확인
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));
        
        // 2. 사용자 존재 확인
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        
        // 3. 방장에게 거절 알림 전송 (자동 거절이든 수동 거절이든 항상 전송)
        Map<String, Object> responseData = Map.of(
                "type", "rejected",
                "friendName", user.getUserName(),
                "roomId", roomId,
                "isAutoReject", isAutoReject
        );
        
        messagingTemplate.convertAndSend("/topic/user/" + room.getOwner().getUserId() + "/friend-invite-response", responseData);
    }
}
