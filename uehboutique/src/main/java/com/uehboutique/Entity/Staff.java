package com.uehboutique.Entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Staff")
@Data
public class Staff {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer staffId;

    @Column(nullable = false, length = 100)
    private String staffName;

    @Column(nullable = false, length = 50, unique = true) // mỗi staff có 1 username riêng
    private String username;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(nullable = false, length = 50)
    private String role; // Ví dụ: Receptionist, Manager
}
