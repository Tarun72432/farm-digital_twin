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
@Table(name = "trees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tree {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @Column(name = "tree_number", nullable = false, unique = true, length = 50)
    private String treeNumber;

    @Column(length = 100)
    @Builder.Default
    private String species = "Moringa Oleifera";

    private Integer age; // in months

    @Column(name = "health_status", length = 20)
    @Builder.Default
    private String healthStatus = "HEALTHY"; // HEALTHY, STRESSED, DISEASED, DEAD

    @Column(columnDefinition = "geometry(Point, 4326)", nullable = false)
    @JsonSerialize(using = GeometrySerializer.class)
    @JsonDeserialize(using = GeometryDeserializer.class)
    private Point location;

    @Column(name = "photo_url", length = 255)
    private String photoUrl;

    @Column(columnDefinition = "TEXT")
    private String notes;

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
}
