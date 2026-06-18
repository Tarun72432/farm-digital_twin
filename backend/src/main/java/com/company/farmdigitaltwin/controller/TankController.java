package com.company.farmdigitaltwin.controller;

import com.company.farmdigitaltwin.dto.TankRequest;
import com.company.farmdigitaltwin.entity.Tank;
import com.company.farmdigitaltwin.service.TankService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tanks")
@Tag(name = "Tanks", description = "Endpoints for Storage Tanks Mapping")
public class TankController {

    private final TankService tankService;

    public TankController(TankService tankService) {
        this.tankService = tankService;
    }

    @GetMapping
    @Operation(summary = "Get all tanks")
    public ResponseEntity<List<Tank>> getAllTanks() {
        return ResponseEntity.ok(tankService.getAllTanks());
    }

    @GetMapping("/farm/{farmId}")
    @Operation(summary = "Get all tanks for a farm")
    public ResponseEntity<List<Tank>> getTanksByFarm(@PathVariable Long farmId) {
        return ResponseEntity.ok(tankService.getTanksByFarm(farmId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a tank by ID")
    public ResponseEntity<Tank> getTankById(@PathVariable Long id) {
        return ResponseEntity.ok(tankService.getTankById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FARM_MANAGER', 'FIELD_OPERATOR')")
    @Operation(summary = "Register a new water tank")
    public ResponseEntity<Tank> createTank(@Valid @RequestBody TankRequest request) {
        return new ResponseEntity<>(tankService.createTank(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FARM_MANAGER', 'FIELD_OPERATOR')")
    @Operation(summary = "Update water tank logs")
    public ResponseEntity<Tank> updateTank(@PathVariable Long id, @Valid @RequestBody TankRequest request) {
        return ResponseEntity.ok(tankService.updateTank(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FARM_MANAGER')")
    @Operation(summary = "Delete a tank record")
    public ResponseEntity<Void> deleteTank(@PathVariable Long id) {
        tankService.deleteTank(id);
        return ResponseEntity.noContent().build();
    }
}
