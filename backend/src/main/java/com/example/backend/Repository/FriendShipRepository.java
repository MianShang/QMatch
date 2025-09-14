package com.example.backend.Repository;


import com.example.backend.Dto.Response.FriendShipResponseDto;
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
    Optional<FriendShip> findByAddresseeAndRequester(User addressee, User requester);

    @Query("SELECT f FROM FriendShip f WHERE (f.requester.id = :userId OR f.addressee.id = :userId) AND f.status = :status")
    List<FriendShip> findFriendsAndStatusByUserIdAndStatus(@Param("userId") Long userId, @Param("status") FriendShipStatus status);
}
