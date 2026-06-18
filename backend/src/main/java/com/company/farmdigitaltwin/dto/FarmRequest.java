package com.company.farmdigitaltwin.dto;

import com.company.farmdigitaltwin.gis.GeometryDeserializer;
import com.company.farmdigitaltwin.gis.GeometrySerializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.locationtech.jts.geom.Polygon;

@Data
public class FarmRequest {

    @NotBlank(message = "Farm name is required")
    @Size(max = 100, message = "Farm name cannot exceed 100 characters")
    private String name;

    @NotBlank(message = "Owner name is required")
    @Size(max = 100, message = "Owner name cannot exceed 100 characters")
    private String ownerName;

    private String description;

    private String status;

    @NotNull(message = "Farm boundary polygon is required")
    @JsonSerialize(using = GeometrySerializer.class)
    @JsonDeserialize(using = GeometryDeserializer.class)
    private Polygon boundary;
}
