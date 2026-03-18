package com.uehboutique.Entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "Service")
@Data
public class Service {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer serviceId;

    @Column(nullable = false, length = 100)
    private String serviceName;

    @Column(nullable = false)
    private BigDecimal unitPrice;
}