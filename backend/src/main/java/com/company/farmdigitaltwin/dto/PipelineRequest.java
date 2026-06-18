package com.company.farmdigitaltwin.dto;

import com.company.farmdigitaltwin.gis.GeometryDeserializer;
import com.company.farmdigitaltwin.gis.GeometrySerializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.locationtech.jts.geom.LineString;

@Data
public class PipelineRequest {

    @NotNull(message = "Farm ID is required")
    private Long farmId;

    @NotBlank(message = "Pipeline name is required")
    @Size(max = 100, message = "Pipeline name cannot exceed 100 characters")
    private String name;

    private Double diameter; // in mm

    private String material;

    private String status;

    @NotNull(message = "Pipeline line path is required")
    @JsonSerialize(using = GeometrySerializer.class)
    @JsonDeserialize(using = GeometryDeserializer.class)
    private LineString geometry;
}
