package com.example.backend.Service;

import com.example.backend.Entity.ChatRoom;
import com.example.backend.Entity.User;
import com.example.backend.Entity.UserChatRoom;
import com.example.backend.Repository.ChatRoomRepository;
import com.example.backend.Repository.UserRepository;
import com.example.backend.Repository.UserChatRoomRepository;
import com.example.backend.enums.ChatRoomUserStatus;
import com.example.backend.Entity.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;
    private final UserChatRoomRepository userChatRoomRepository;

    // 입장 신청
    @Transactional
    public boolean apply(String roomId, String userId) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("방 없음"));
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("유저 없음"));

        // 방장은 신청 불필요 → 바로 ACCEPTED
        if (chatRoom.getOwner().equals(user)) {
            userChatRoomRepository.findByUserAndChatRoom(user, chatRoom)
                    .ifPresentOrElse(
                            ucr -> ucr.setStatus(ChatRoomUserStatus.ACCEPTED), // 방장은 즉시 ACCEPTED
                            () -> {
                                UserChatRoom ucr = new UserChatRoom(user, chatRoom, Role.HOST);
                                ucr.setStatus(ChatRoomUserStatus.ACCEPTED);
                                userChatRoomRepository.save(ucr);
                            }
                    );
            return false;
        }

        // 일반 멤버는 무조건 PENDING 상태
        userChatRoomRepository.findByUserAndChatRoom(user, chatRoom)
                .ifPresentOrElse(
                        ucr -> ucr.setStatus(ChatRoomUserStatus.PENDING),
                        () -> {
                            UserChatRoom ucr = new UserChatRoom(user, chatRoom, Role.MEMBER);
                            ucr.setStatus(ChatRoomUserStatus.PENDING);
                            userChatRoomRepository.save(ucr);
                        }
                );
        return true;
    }

    // 수락
    @Transactional
    public void accept(String roomId, String userId) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("방 없음"));
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("유저 없음"));

        UserChatRoom ucr = userChatRoomRepository.findByUserAndChatRoom(user, chatRoom)
                .orElseThrow(() -> new RuntimeException("대기중인 신청 없음"));

        // 상태를 ACCEPTED로 변경
        ucr.setStatus(ChatRoomUserStatus.ACCEPTED);

        // 인원수 증가
        chatRoom.setCurrentUsers(chatRoom.getCurrentUsers() + 1);
    }

    // 거절
    @Transactional
    public void reject(String roomId, String userId) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("방 없음"));
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("유저 없음"));

        UserChatRoom ucr = userChatRoomRepository.findByUserAndChatRoom(user, chatRoom)
                .orElseThrow(() -> new RuntimeException("대기중인 신청 없음"));

        ucr.setStatus(ChatRoomUserStatus.REJECTED);
    }

    // 대기자 조회
    public List<UserChatRoom> getPendingUsers(String roomId) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("방 없음"));
        return userChatRoomRepository.findByChatRoomAndStatus(chatRoom, ChatRoomUserStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public String getOwnerId(String roomId) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("방 없음"));
        return chatRoom.getOwner().getUserId(); // owner는 User 엔티티, 그 안에서 userId 반환
    }
}
