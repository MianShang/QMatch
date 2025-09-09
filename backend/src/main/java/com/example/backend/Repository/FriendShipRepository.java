package com.example.backend.Repository;


import com.example.backend.Entity.FriendShip;
import com.example.backend.Entity.User;
import com.example.backend.enums.FriendShipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface FriendShipRepository extends JpaRepository<FriendShip,Long> {
    Optional<FriendShip> findByRequesterAndAddresseeAndStatus(User requester, User addressee, FriendShipStatus status);
    Optional<FriendShip> findByRequesterAndAddressee(User requester, User addressee);
    Optional<FriendShip> findByAddresseeAndRequester(User addressee, User requester);
    @Query("SELECT f FROM FriendShip f WHERE (f.requester = :user OR f.addressee = :user) AND f.status = :status")
    List<FriendShip> findFriendsByUserAndStatus(User user, FriendShipStatus status);
}
