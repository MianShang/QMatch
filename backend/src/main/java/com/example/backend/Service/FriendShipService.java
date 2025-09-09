package com.example.backend.Service;

import com.example.backend.Dto.UserDto;
import com.example.backend.Entity.FriendShip;
import com.example.backend.Entity.User;
import com.example.backend.Repository.FriendShipRepository;
import com.example.backend.Repository.UserRepository;
import com.example.backend.enums.FriendShipStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor

public class FriendShipService {

    private final FriendShipRepository friendshipRepository;
    private final UserRepository userRepository;

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
    
    //수락 대기중인 친구
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
    public List<UserDto> getFriendsList(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        List<FriendShip> friendships = friendshipRepository.findFriendsByUserAndStatus(user, FriendShipStatus.ACCEPTED);

        return friendships.stream()
                .map(friendship -> {
                    User friendUser;
                    if (friendship.getRequester().getUserId().equals(userId)) {
                        friendUser = friendship.getAddressee();
                    } else {
                        friendUser = friendship.getRequester();
                    }
                    return new UserDto(friendUser); // User 엔티티를 DTO로 변환
                })
                .collect(Collectors.toList());
    }

}
