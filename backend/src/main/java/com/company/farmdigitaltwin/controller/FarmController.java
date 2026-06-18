package com.company.farmdigitaltwin.controller;

import com.company.farmdigitaltwin.dto.FarmRequest;
import com.company.farmdigitaltwin.entity.Farm;
import com.company.farmdigitaltwin.service.FarmService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/farms")
@Tag(name = "Farms", description = "Endpoints for Farm Boundary and Area Management")
public class FarmController {

    private final FarmService farmService;

    public FarmController(FarmService farmService) {
        this.farmService = farmService;
    }

    @GetMapping
    @Operation(summary = "Get all farms with boundary geometries")
    public ResponseEntity<List<Farm>> getAllFarms() {
        return ResponseEntity.ok(farmService.getAllFarms());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a farm by ID")
    public ResponseEntity<Farm> getFarmById(@PathVariable Long id) {
        return ResponseEntity.ok(farmService.getFarmById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FARM_MANAGER')")
    @Operation(summary = "Create a new farm and calculate boundary area")
    public ResponseEntity<Farm> createFarm(@Valid @RequestBody FarmRequest request) {
        return new ResponseEntity<>(farmService.createFarm(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FARM_MANAGER')")
    @Operation(summary = "Update an existing farm's details and recalculate area")
    public ResponseEntity<Farm> updateFarm(@PathVariable Long id, @Valid @RequestBody FarmRequest request) {
        return ResponseEntity.ok(farmService.updateFarm(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Delete a farm")
    public ResponseEntity<Void> deleteFarm(@PathVariable Long id) {
        farmService.deleteFarm(id);
        return ResponseEntity.noContent().build();
    }
}
