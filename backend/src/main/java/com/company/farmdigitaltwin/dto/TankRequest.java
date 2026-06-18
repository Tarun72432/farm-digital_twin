package com.company.farmdigitaltwin.dto;

import com.company.farmdigitaltwin.gis.GeometryDeserializer;
import com.company.farmdigitaltwin.gis.GeometrySerializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.locationtech.jts.geom.Point;

@Data
public class TankRequest {

    @NotNull(message = "Farm ID is required")
    private Long farmId;

    @NotBlank(message = "Tank name is required")
    @Size(max = 100, message = "Tank name cannot exceed 100 characters")
    private String name;

    private Double capacity; // in Liters

    private String material;

    private Double height; // in meters

    private String status;

    @NotNull(message = "Tank location coordinate is required")
    @JsonSerialize(using = GeometrySerializer.class)
    @JsonDeserialize(using = GeometryDeserializer.class)
    private Point geometry;

    private String photoUrl;
}
