package com.uehboutique.Entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name ="Guest")
@Data
public class Guest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer guestId;

    @Column(nullable = false, length = 100)
    private String guestName;

    @Column(nullable = false, length = 20, unique = true) // Căn cước/Passport không được trùng
    private String idCard;

    @Column(length = 15)
    private String phone;

    @Column(length = 255) // Sở thích của khách
    private String preferences;
}
