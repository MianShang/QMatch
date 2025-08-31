package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Getter @Setter
@Table(
        name = "user_status",
        indexes = { @Index(name = "idx_user_status_user", columnList = "userId", unique = true) }
)
public class UserStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, unique = true)
    private String userId;

    @Column(nullable=false)
    private String status; // "온라인","자리비움","오프라인"

    @UpdateTimestamp
    private Instant updatedAt;
}
