package com.example.backend.Service;

import com.example.backend.Entity.FriendShipChatReadStatus;
import com.example.backend.Entity.FriendShipChatRoom;
import com.example.backend.Repository.FriendShipChatMessageRepository;
import com.example.backend.Repository.FriendShipChatReadStatusRepository;
import com.example.backend.Repository.FriendShipChatRoomRepository;
import com.example.backend.Repository.FriendShipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FriendShipChatReadStatusService {

    private final FriendShipChatReadStatusRepository friendchatreadStatusRepo;
    private final FriendShipChatRoomRepository friendchatroomRepo;
    private final FriendShipRepository friendshipRepo;
    private final SimpMessagingTemplate messagingTemplate;

    /* roomId, userId 기준으로 마지막 읽은 메시지 ID 조회 */
    @Transactional(readOnly = true)
    public long getLastReadMessageId(Long roomId, String userId) {
        List<FriendShipChatReadStatus> list =
                friendchatreadStatusRepo.findByFriendShipChatRoom_IdAndUserId(roomId, userId);

        if (list.isEmpty()) return 0L;

        // 가장 최근 lastReadMessageId 선택
        return list.stream()
                .mapToLong(FriendShipChatReadStatus::getLastReadMessageId)
                .max()
                .orElse(0L);
    }

    /*기존 메시지 Id값 보다 큰 값일 때만 갱신 */
    @Transactional
    public void friendIsRead(Long roomId, String userId, Long newLastReadMessageId) {
        FriendShipChatRoom room = friendchatroomRepo.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을수 없습니다 :  " + roomId));

        List<FriendShipChatReadStatus> statuses =
                friendchatreadStatusRepo.findByFriendShipChatRoom_IdAndUserId(roomId, userId);

        if (!statuses.isEmpty()) {
            // 중복이 있더라도 가장 최근 것만 업데이트
            FriendShipChatReadStatus read = statuses.get(0);
            Long prev = read.getLastReadMessageId();
            if (prev == null || (newLastReadMessageId != null && newLastReadMessageId > prev)) {
                read.setLastReadMessageId(newLastReadMessageId);
            }

            // 혹시 모를 중복 데이터는 정리
            if (statuses.size() > 1) {
                for (int i = 1; i < statuses.size(); i++) {
                    friendchatreadStatusRepo.delete(statuses.get(i));
                }
            }
        } else {
            friendchatreadStatusRepo.save(new FriendShipChatReadStatus(room, userId, newLastReadMessageId));
        }

        String friendId = room.getFriendship().getRequester().getUserId().equals(userId)
                ? room.getFriendship().getAddressee().getUserId()
                : room.getFriendship().getRequester().getUserId();

        messagingTemplate.convertAndSend("/topic/friends/unread/" + userId,
                Map.of("friendId", friendId, "unreadCount", 0));

    }
}
