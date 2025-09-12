package com.example.backend.Repository;


import com.example.backend.Entity.FriendShip;
import com.example.backend.Entity.User;
import com.example.backend.enums.FriendShipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendShipRepository extends JpaRepository<FriendShip,Long> {
    Optional<FriendShip> findByRequesterAndAddresseeAndStatus(User requester, User addressee, FriendShipStatus status);
    Optional<FriendShip> findByRequesterAndAddressee(User requester, User addressee);

    @Query("SELECT f FROM FriendShip f WHERE (f.requester.id = :userId OR f.addressee.id = :userId) AND f.status IN ('ACCEPTED')")
    List<FriendShip> findFriendsAcceptedByUserId(@Param("userId") long id);

    @Query("SELECT f FROM FriendShip f where (f.requester = :requesterId) AND f.status IN ('BLOCKED')")
    List<FriendShip> findByBlockUser(@Param("requesterId") User requester);

    @Query("SELECT f FROM FriendShip f where (f.addressee.id = :userId) AND f.status IN ('PENDING')")
    List<FriendShip> findFriendsPendingByUserId(@Param("userId") long id);

}
