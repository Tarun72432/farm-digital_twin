package com.company.farmdigitaltwin.controller;

import com.company.farmdigitaltwin.dto.InfrastructureRequest;
import com.company.farmdigitaltwin.entity.Infrastructure;
import com.company.farmdigitaltwin.service.InfrastructureService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/infrastructure")
@Tag(name = "Infrastructure", description = "Endpoints for Farm Infrastructure Mapping")
public class InfrastructureController {

    private final InfrastructureService infrastructureService;

    public InfrastructureController(InfrastructureService infrastructureService) {
        this.infrastructureService = infrastructureService;
    }

    @GetMapping
    @Operation(summary = "Get all infrastructures")
    public ResponseEntity<List<Infrastructure>> getAllInfrastructure() {
        return ResponseEntity.ok(infrastructureService.getAllInfrastructure());
    }

    @GetMapping("/farm/{farmId}")
    @Operation(summary = "Get all infrastructure for a farm")
    public ResponseEntity<List<Infrastructure>> getInfrastructureByFarm(@PathVariable Long farmId) {
        return ResponseEntity.ok(infrastructureService.getInfrastructureByFarm(farmId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get infrastructure by ID")
    public ResponseEntity<Infrastructure> getInfrastructureById(@PathVariable Long id) {
        return ResponseEntity.ok(infrastructureService.getInfrastructureById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FARM_MANAGER', 'FIELD_OPERATOR')")
    @Operation(summary = "Map a new infrastructure")
    public ResponseEntity<Infrastructure> createInfrastructure(@Valid @RequestBody InfrastructureRequest request) {
        return new ResponseEntity<>(infrastructureService.createInfrastructure(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FARM_MANAGER', 'FIELD_OPERATOR')")
    @Operation(summary = "Update an infrastructure feature")
    public ResponseEntity<Infrastructure> updateInfrastructure(@PathVariable Long id, @Valid @RequestBody InfrastructureRequest request) {
        return ResponseEntity.ok(infrastructureService.updateInfrastructure(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FARM_MANAGER')")
    @Operation(summary = "Delete an infrastructure record")
    public ResponseEntity<Void> deleteInfrastructure(@PathVariable Long id) {
        infrastructureService.deleteInfrastructure(id);
        return ResponseEntity.noContent().build();
    }
}
