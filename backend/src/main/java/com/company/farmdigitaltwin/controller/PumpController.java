package com.company.farmdigitaltwin.controller;

import com.company.farmdigitaltwin.dto.PumpRequest;
import com.company.farmdigitaltwin.entity.Pump;
import com.company.farmdigitaltwin.service.PumpService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pumps")
@Tag(name = "Pumps", description = "Endpoints for Water Pumps Mapping")
public class PumpController {

    private final PumpService pumpService;

    public PumpController(PumpService pumpService) {
        this.pumpService = pumpService;
    }

    @GetMapping
    @Operation(summary = "Get all pumps")
    public ResponseEntity<List<Pump>> getAllPumps() {
        return ResponseEntity.ok(pumpService.getAllPumps());
    }

    @GetMapping("/farm/{farmId}")
    @Operation(summary = "Get all pumps for a farm")
    public ResponseEntity<List<Pump>> getPumpsByFarm(@PathVariable Long farmId) {
        return ResponseEntity.ok(pumpService.getPumpsByFarm(farmId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a pump by ID")
    public ResponseEntity<Pump> getPumpById(@PathVariable Long id) {
        return ResponseEntity.ok(pumpService.getPumpById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FARM_MANAGER', 'FIELD_OPERATOR')")
    @Operation(summary = "Register a new pump")
    public ResponseEntity<Pump> createPump(@Valid @RequestBody PumpRequest request) {
        return new ResponseEntity<>(pumpService.createPump(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FARM_MANAGER', 'FIELD_OPERATOR')")
    @Operation(summary = "Update a pump's details")
    public ResponseEntity<Pump> updatePump(@PathVariable Long id, @Valid @RequestBody PumpRequest request) {
        return ResponseEntity.ok(pumpService.updatePump(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FARM_MANAGER')")
    @Operation(summary = "Delete a pump record")
    public ResponseEntity<Void> deletePump(@PathVariable Long id) {
        pumpService.deletePump(id);
        return ResponseEntity.noContent().build();
    }
}
