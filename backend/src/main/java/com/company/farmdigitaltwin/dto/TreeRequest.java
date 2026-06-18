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
public class TreeRequest {

    @NotNull(message = "Farm ID is required")
    private Long farmId;

    @NotBlank(message = "Tree number is required")
    @Size(max = 50, message = "Tree number cannot exceed 50 characters")
    private String treeNumber;

    private String species;

    private Integer age;

    private String healthStatus;

    @NotNull(message = "Tree coordinate location is required")
    @JsonSerialize(using = GeometrySerializer.class)
    @JsonDeserialize(using = GeometryDeserializer.class)
    private Point location;

    private String photoUrl;

    private String notes;
}
