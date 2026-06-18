package com.company.farmdigitaltwin.controller;

import com.company.farmdigitaltwin.dto.ValveRequest;
import com.company.farmdigitaltwin.entity.Valve;
import com.company.farmdigitaltwin.service.ValveService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/valves")
@Tag(name = "Valves", description = "Endpoints for Drip Irrigation Valves Mapping")
public class ValveController {

    private final ValveService valveService;

    public ValveController(ValveService valveService) {
        this.valveService = valveService;
    }

    @GetMapping
    @Operation(summary = "Get all valves")
    public ResponseEntity<List<Valve>> getAllValves() {
        return ResponseEntity.ok(valveService.getAllValves());
    }

    @GetMapping("/farm/{farmId}")
    @Operation(summary = "Get all valves for a farm")
    public ResponseEntity<List<Valve>> getValvesByFarm(@PathVariable Long farmId) {
        return ResponseEntity.ok(valveService.getValvesByFarm(farmId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a valve by ID")
    public ResponseEntity<Valve> getValveById(@PathVariable Long id) {
        return ResponseEntity.ok(valveService.getValveById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FARM_MANAGER', 'FIELD_OPERATOR')")
    @Operation(summary = "Map a new valve")
    public ResponseEntity<Valve> createValve(@Valid @RequestBody ValveRequest request) {
        return new ResponseEntity<>(valveService.createValve(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FARM_MANAGER', 'FIELD_OPERATOR')")
    @Operation(summary = "Update an existing valve")
    public ResponseEntity<Valve> updateValve(@PathVariable Long id, @Valid @RequestBody ValveRequest request) {
        return ResponseEntity.ok(valveService.updateValve(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FARM_MANAGER')")
    @Operation(summary = "Delete a valve record")
    public ResponseEntity<Void> deleteValve(@PathVariable Long id) {
        valveService.deleteValve(id);
        return ResponseEntity.noContent().build();
    }
}
