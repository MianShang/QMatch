package com.example.backend.Repository;

import com.example.backend.Entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, String> {
    List<ChatRoom> findByNameContainingIgnoreCase(String keyword);

    @Query("SELECT DISTINCT r FROM ChatRoom r JOIN r.chatRoomTags crt JOIN crt.gameTag gt WHERE (gt.id IN :tagIds) AND r.gameName = :gametag")
    List<ChatRoom> findByGameAndTagIdsIn(@Param("tagIds")List<Long> tagIds, @Param("gametag")String gametag);

    List<ChatRoom> findByGameName(String gameName);

    @Query("""
  SELECT DISTINCT r
  FROM ChatRoom r
  JOIN r.chatRoomTags crt
  JOIN crt.gameTag gt
  WHERE r.gameName = :gametag
    AND gt.id IN :tagIds
    AND LOWER(r.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
""")
    List<ChatRoom> findByGameAndKeywordAndTagIdsIn(
            @Param("tagIds") List<Long> tagIds,
            @Param("gametag") String gametag,
            @Param("keyword") String keyword
    );

    @Query("""
    SELECT DISTINCT r
    FROM ChatRoom r
    WHERE r.gameName = :gametag
    AND LOWER(r.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
""")
    List<ChatRoom> findByGameAndKeyword(String gametag, @Param("keyword") String keyword);

    @Query("""
      select cr from ChatRoom cr
      left join fetch cr.chatRoomTags crt
      left join fetch crt.gameTag gt
      where cr.id = :id
    """)
    Optional<ChatRoom> findDetailById(@Param("id") String id);
}
