package com.uehboutique.Entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "RoomType")
@Data
public class RoomType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer roomTypeId;

    @Column(nullable = false, length = 100)
    private String typeName;

    @Column(nullable = false)
    private BigDecimal basePrice;
}