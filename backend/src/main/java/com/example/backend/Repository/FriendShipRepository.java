package com.example.backend.Repository;


import com.example.backend.Entity.FriendShip;
import com.example.backend.Entity.User;
import com.example.backend.enums.FriendShipStatus;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendShipRepository extends JpaRepository<FriendShip,Long> {


    Optional<FriendShip> findByRequesterAndAddresseeAndStatus(User requester, User addressee, FriendShipStatus status);
    Optional<FriendShip> findByRequesterAndAddressee(User requester, User addressee);
    
    //수락관계
    @Query("SELECT f FROM FriendShip f WHERE (f.requester.id = :userId OR f.addressee.id = :userId) AND f.status IN ('ACCEPTED')")
    List<FriendShip> findFriendsAcceptedByUserId(@Param("userId") long id);
    
    
    //차단 관계
    @Query("SELECT f FROM FriendShip f WHERE f.requester = :requesterId AND f.status IN ('BLOCKED', 'BLOCKS')")
    List<FriendShip> findByBlockUser(@Param("requesterId") User requester);
    
    //대기 상태
    @Query("SELECT f FROM FriendShip f where (f.addressee.id = :userId) AND f.status IN ('PENDING')")
    List<FriendShip> findFriendsPendingByUserId(@Param("userId") long id);
    
    //친구 관계 삭제
    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("DELETE FROM FriendShip f " +
            "WHERE ((f.requester = :requester AND f.addressee = :addressee) " +
            "   OR  (f.requester = :addressee AND f.addressee = :requester)) " +
            "AND f.status IN ('BLOCKED','BLOCKS','ACCEPTED')")
    void deleteFriendshipBothWays(@Param("requester") User requester,
                                  @Param("addressee") User addressee);


}
