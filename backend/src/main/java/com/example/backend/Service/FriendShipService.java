package com.example.backend.Service;

import com.example.backend.Dto.Response.FriendShipResponseDto;
import com.example.backend.Entity.FriendShip;
import com.example.backend.Entity.User;
import com.example.backend.Entity.UserStatus;
import com.example.backend.Repository.FriendShipRepository;
import com.example.backend.Repository.UserRepository;
import com.example.backend.enums.FriendShipStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.backend.Repository.UserStatusRepository;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.Map;
import java.util.Optional;
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

        // Addressee -> Requester 관계,Requester -> Addressee 관계 확인
        Optional<FriendShip> friendshipOptional = friendshipRepository.findByRequesterAndAddressee(requester, addressee)
                .or(() -> friendshipRepository.findByRequesterAndAddressee(addressee, requester));

        if (friendshipOptional.isPresent()) {
            FriendShip existingFriendship = friendshipOptional.get();

            if (existingFriendship.getStatus() == FriendShipStatus.BLOCKED) {
                throw new IllegalStateException("사용자가 없거나 차단된 사용자입니다.");
            }

            if (existingFriendship.getStatus() == FriendShipStatus.PENDING || existingFriendship.getStatus() == FriendShipStatus.ACCEPTED) {
                throw new IllegalStateException("이미 친구이거나 요청이 존재합니다.");
            }

            // REJECTED 상태라면 PENDING으로 상태 업데이트
            existingFriendship.setStatus(FriendShipStatus.PENDING);
            friendshipRepository.save(existingFriendship);
        } else {
            // 기존 관계가 없는 경우, 새로운 요청 생성
            FriendShip newRequest = new FriendShip(requester, addressee, FriendShipStatus.PENDING);
            friendshipRepository.save(newRequest);
        }
        simpMessagingTemplate.convertAndSend("/topic/friends/" + addresseeId,
                Map.of("title", "새로운 친구 요청", "message", requester.getUserName() + "님이 친구 요청을 보냈습니다."));

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

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                // 요청자 토스트
                simpMessagingTemplate.convertAndSend(
                        "/topic/friends/" + requester.getUserId(),
                        Map.of("message", addressee.getUserName() + "님이 친구 요청을 수락했습니다.")
                );

                // 수락자 토스트
                simpMessagingTemplate.convertAndSend(
                        "/topic/friends/" + addressee.getUserId(),
                        Map.of("message", requester.getUserName() + "님과 친구가 되었습니다.")
                );

                //inventory 양방향 갱신
                simpMessagingTemplate.convertAndSend(
                        "/topic/friends/inventory/" + requesterId,
                        Map.of("bottomToggle", "friends")
                );
                simpMessagingTemplate.convertAndSend(
                        "/topic/friends/inventory/" + addresseeId,
                        Map.of("bottomToggle", "friends")
                );
            }
        });
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

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                //요청자 토스트
                simpMessagingTemplate.convertAndSend(
                        "/topic/friends/" + requesterId,
                        Map.of("message", addressee.getUserName() + "님이 친구요청을 거절하였습니다.")
                );

                //수락자 토스트
                simpMessagingTemplate.convertAndSend(
                        "/topic/friends/" + addresseeId,
                        Map.of("message", requester.getUserName() + "님의 친구요청 거절되었습니다.")
                );

                //inventory 양방향 갱신
                simpMessagingTemplate.convertAndSend(
                        "/topic/friends/inventory/" + requesterId,
                        Map.of("bottomToggle", "friends")
                );
                simpMessagingTemplate.convertAndSend(
                        "/topic/friends/inventory/" + addresseeId,
                        Map.of("bottomToggle", "friends")
                );
            }
        });
    }

    // 친구 목록을 조회하는 메서드
    @Transactional(readOnly = true) // 데이터 변경이 없으므로 읽기 전용으로 설정
    public List<FriendShipResponseDto> getFriendsList(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        //차단된 관계를 제외한 모든 친구 관계를 조회
        List<FriendShip> friendships = friendshipRepository.findFriendsAcceptedByUserId(user.getId());

        //친구Id를 목록으로 추출
        List<String> friendUserIds = friendships.stream()
                .map(friendship -> friendship.getRequester().getUserId().equals(userId)
                        ? friendship.getAddressee().getUserId()
                        : friendship.getRequester().getUserId())
                .collect(Collectors.toList());

        //친구들의 상태 조회하여 Map으로 변환
        Map<String, String> statusMap = userStatusRepository.findStatusByUserIdIn(friendUserIds).stream()
                .collect(Collectors.toMap(UserStatus::getUserId, UserStatus::getStatus, (oldValue, newValue) -> newValue));
        
        System.out.println("친구목록 조회 성공");
        
        // 4. DTO로 변환
        return friendships.stream()
                .map(friendship -> {
                    User friendUser = friendship.getRequester().getUserId().equals(userId)
                            ? friendship.getAddressee()
                            : friendship.getRequester();

                    // Map에서 올바른 친구의 상태를 조회
                    String status = statusMap.getOrDefault(friendUser.getUserId(), "오프라인");

                    return new FriendShipResponseDto(friendUser, status);
                })
                .collect(Collectors.toList());
    }

    //사용자 차단
    @Transactional
    public void blockUser(String requesterId, String blockedId) {
        User requester = userRepository.findByUserId(requesterId)
                .orElseThrow(() -> new IllegalArgumentException("요청한 사용자를 찾을 수 없습니다."));

        User targetUser = userRepository.findByUserId(blockedId)
                .orElseThrow(() -> new IllegalArgumentException("차단할 사용자를 찾을 수 없습니다."));

        // 요청자 → 대상
        Optional<FriendShip> directRelation = friendshipRepository.findByRequesterAndAddressee(requester, targetUser);

        // 대상 → 요청자 (역방향)
        Optional<FriendShip> reverseRelation = friendshipRepository.findByRequesterAndAddressee(targetUser, requester);

        // 직접 관계가 없으면 새로 생성
        FriendShip relation = directRelation.orElseGet(
                () -> new FriendShip(requester, targetUser, FriendShipStatus.BLOCKED)
        );
        relation.setStatus(FriendShipStatus.BLOCKED);
        friendshipRepository.save(relation);

        // 양쪽 모두 BLOCKED라면 BLOCKS 처리
        if (reverseRelation.isPresent() && reverseRelation.get().getStatus() == FriendShipStatus.BLOCKED) {
            relation.setStatus(FriendShipStatus.BLOCKS);
            FriendShip reverse = reverseRelation.get();
            reverse.setStatus(FriendShipStatus.BLOCKS);

            friendshipRepository.save(relation);
            friendshipRepository.save(reverse);
        }

        simpMessagingTemplate.convertAndSend(
                "/topic/friends/status",
                Map.of("userId", requesterId, "status", relation.getStatus().name())
        );
    }

    @Transactional
    public List<FriendShipResponseDto> getUserInventoryList(String requesterId, String bottomToggle)
    {
        User user = userRepository.findByUserId(requesterId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        List<FriendShip> friendships;

        friendships = bottomToggle.equals("friends") ? friendshipRepository.findFriendsPendingByUserId(user.getId())
                : friendshipRepository.findByBlockUser(user);

        return friendships.stream()
                .map(friendship -> {
                    User friendUser;
                    if (bottomToggle.equals("friends")) {
                        friendUser = friendship.getRequester();
                    } else { // "blocked"인 경우
                        friendUser = friendship.getAddressee(); // receiver를 가져오도록 수정
                    }

                    return new FriendShipResponseDto(friendUser);
                })
                .collect(Collectors.toList());
    }
}