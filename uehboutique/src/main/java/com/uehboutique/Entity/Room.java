package com.uehboutique.Entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Room")
@Data
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer roomId;

    @Column(nullable = false, length = 20)
    private String roomNumber;

    @Column(nullable = false, length = 50)
    private String status; // Trống, Bẩn, Đang ở

    @ManyToOne
    @JoinColumn(name = "roomTypeId", nullable = false)
    private RoomType roomType;
}