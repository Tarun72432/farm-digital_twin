package com.company.farmdigitaltwin.entity;

import com.company.farmdigitaltwin.gis.GeometryDeserializer;
import com.company.farmdigitaltwin.gis.GeometrySerializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;

import java.time.Instant;

@Entity
@Table(name = "tanks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tank {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @Column(nullable = false, length = 100)
    private String name;

    private Double capacity; // in Liters

    @Column(length = 50)
    private String material;

    private Double height; // in meters

    @Column(length = 20)
    @Builder.Default
    private String status = "OPERATIONAL";

    @Column(columnDefinition = "geometry(Point, 4326)", nullable = false)
    @JsonSerialize(using = GeometrySerializer.class)
    @JsonDeserialize(using = GeometryDeserializer.class)
    private Point geometry;

    @Column(name = "photo_url", length = 255)
    private String photoUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    @jakarta.persistence.Transient
    @com.fasterxml.jackson.annotation.JsonProperty("farmId")
    public Long getAssignedFarmId() {
        return farm != null ? farm.getId() : null;
    }

    @jakarta.persistence.Transient
    @com.fasterxml.jackson.annotation.JsonProperty("farmName")
    public String getAssignedFarmName() {
        return farm != null ? farm.getName() : null;
    }
}
