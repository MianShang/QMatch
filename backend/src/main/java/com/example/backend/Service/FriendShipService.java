package com.example.backend.Service;

import com.example.backend.Dto.Response.FriendShipResponseDto;
import com.example.backend.Entity.FriendShip;
import com.example.backend.Entity.User;
import com.example.backend.Repository.FriendShipRepository;
import com.example.backend.Repository.UserRepository;
import com.example.backend.enums.FriendShipStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.backend.Repository.UserStatusRepository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor

public class FriendShipService {

    private final FriendShipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate simpMessagingTemplate;
    private final UserStatusRepository userStatusRepository;

    //친구 요청 보낼때
    @Transactional
    public void sendFriendRequest(String requesterId, String addresseeId)
    {
        if (requesterId.equals(addresseeId))
        {
            throw new IllegalArgumentException("자기 자신에게 친구 추가를 보낼수 없습니다");
        }
        User requester = userRepository.findByUserId(requesterId)
                .orElseThrow(() -> new IllegalArgumentException("요청을 보낸 사용자를 찾을 수 없습니다."));
        User addressee = userRepository.findByUserId(addresseeId)
                .orElseThrow(() -> new IllegalArgumentException("요청을 받은 사용자를 찾을 수 없습니다."));

        if (friendshipRepository.findByRequesterAndAddressee(requester, addressee).isPresent() ||
                friendshipRepository.findByAddresseeAndRequester(addressee, requester).isPresent()) {
            throw new IllegalStateException("이미 친구이거나 요청이 존재합니다.");
        }

        FriendShip newRequest = new FriendShip(requester, addressee, FriendShipStatus.PENDING);

        simpMessagingTemplate.convertAndSend("/topic/friends/" + addresseeId,
                Map.of("title", "새로운 친구 요청", "message", requester.getUserName() + "님이 친구 요청을 보냈습니다."
                )
        );

        friendshipRepository.save(newRequest);
    }

    //친구요청 수락
    @Transactional
    public void acceptFriendRequest(String requesterId, String addresseeId) {
        User requester = userRepository.findByUserId(requesterId)
                .orElseThrow(() -> new IllegalArgumentException("요청을 보낸 사용자를 찾을 수 없습니다."));
        User addressee = userRepository.findByUserId(addresseeId)
                .orElseThrow(() -> new IllegalArgumentException("요청을 받은 사용자를 찾을 수 없습니다."));

        FriendShip friendship = friendshipRepository.findByRequesterAndAddresseeAndStatus(requester, addressee, FriendShipStatus.PENDING)
                .orElseThrow(() -> new IllegalArgumentException("대기 중인 친구 요청이 없습니다."));

        friendship.setStatus(FriendShipStatus.ACCEPTED);
        friendshipRepository.save(friendship);
    }
    
    //친구요청 거절
    @Transactional
    public void rejectFriendRequest(String requesterId, String addresseeId) {
        User requester = userRepository.findByUserId(requesterId)
                .orElseThrow(() -> new IllegalArgumentException("요청을 보낸 사용자를 찾을 수 없습니다."));
        User addressee = userRepository.findByUserId(addresseeId)
                .orElseThrow(() -> new IllegalArgumentException("요청을 받은 사용자를 찾을 수 없습니다."));

        FriendShip friendship = friendshipRepository.findByRequesterAndAddresseeAndStatus(requester, addressee, FriendShipStatus.PENDING)
                .orElseThrow(() -> new IllegalArgumentException("대기 중인 친구 요청이 없습니다."));

        friendship.setStatus(FriendShipStatus.REJECTED);
        friendshipRepository.save(friendship);
    }

    // 친구 목록을 조회하는 메서드
    @Transactional(readOnly = true) // 데이터 변경이 없으므로 읽기 전용으로 설정
    public List<FriendShipResponseDto> getFriendsList(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));


        List<FriendShip> friendships = friendshipRepository.findFriendsAndStatusByUserIdAndStatus(user.getId(), FriendShipStatus.ACCEPTED);

        return friendships.stream()
                .map(friendship -> {
                    User friendUser = friendship.getRequester().getUserId().equals(userId)
                            ? friendship.getAddressee()
                            : friendship.getRequester();

                    String status = userStatusRepository.findStatusByUserId(friendUser.getUserId())
                            .orElse("오프라인");

                    return new FriendShipResponseDto(friendUser, status);
                })
                .collect(Collectors.toList());
    }
}