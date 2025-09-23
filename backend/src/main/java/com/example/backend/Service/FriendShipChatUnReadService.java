package com.example.backend.Service;

import com.example.backend.Repository.FriendShipChatUnReadRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendShipChatUnReadService {

    private final FriendShipChatUnReadRepository friendShipChatUnReadRepository;

    // 방 수신자 안읽은 메시지 개수
    public Long getRoomMessageConunt(String roomId, String receiveId){
        try {
            // 문자열 roomId를 Long으로 변환
            Long id = Long.parseLong(roomId);
            return friendShipChatUnReadRepository.countByFriendShipChatRoom_IdAndReceiveId(id,receiveId);
        } catch (NumberFormatException e) {
            // roomId가 숫자가 아닌 경우 0 반환
            return 0L;
        }
    }
    
    
    //방 수신자 안읽은 메시지 삭제
    @Transactional
    public void deleteRoomMessageCount(Long id, String receiveId){
        friendShipChatUnReadRepository.deleteByFriendShipChatRoom_IdAndReceiveId(id, receiveId);
    }


    public Map<Long, Long> getAllChatRoomMessagesCount(String receiveid){
        List<Object[]> result = friendShipChatUnReadRepository.countAllUnreadByReceiveId(receiveid);

        return result.stream().collect(Collectors.toMap(
                a -> (Long) a[0],
                a -> (Long) a[1]
        ));
    }
}
