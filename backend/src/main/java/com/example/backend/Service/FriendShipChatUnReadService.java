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
    public Long getRoomMessageConunt(Long id, String receiveId){
        return friendShipChatUnReadRepository.countByFriendShipChatRoom_IdAndReceiveId(id,receiveId);
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
