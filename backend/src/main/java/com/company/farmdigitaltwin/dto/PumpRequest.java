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
public class PumpRequest {

    @NotNull(message = "Farm ID is required")
    private Long farmId;

    @NotBlank(message = "Pump name is required")
    @Size(max = 100, message = "Pump name cannot exceed 100 characters")
    private String name;

    private Double capacity; // in L/hr

    private Double powerRating; // in HP

    private String manufacturer;

    private String status;

    @NotNull(message = "Pump location coordinate is required")
    @JsonSerialize(using = GeometrySerializer.class)
    @JsonDeserialize(using = GeometryDeserializer.class)
    private Point geometry;

    private String photoUrl;
}
