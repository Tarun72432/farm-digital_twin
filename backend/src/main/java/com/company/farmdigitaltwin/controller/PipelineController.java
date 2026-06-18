package com.company.farmdigitaltwin.controller;

import com.company.farmdigitaltwin.dto.PipelineRequest;
import com.company.farmdigitaltwin.entity.Pipeline;
import com.company.farmdigitaltwin.service.PipelineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pipelines")
@Tag(name = "Pipelines", description = "Endpoints for Irrigation Pipelines Management")
public class PipelineController {

    private final PipelineService pipelineService;

    public PipelineController(PipelineService pipelineService) {
        this.pipelineService = pipelineService;
    }

    @GetMapping
    @Operation(summary = "Get all pipelines")
    public ResponseEntity<List<Pipeline>> getAllPipelines() {
        return ResponseEntity.ok(pipelineService.getAllPipelines());
    }

    @GetMapping("/farm/{farmId}")
    @Operation(summary = "Get all pipelines for a farm")
    public ResponseEntity<List<Pipeline>> getPipelinesByFarm(@PathVariable Long farmId) {
        return ResponseEntity.ok(pipelineService.getPipelinesByFarm(farmId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a pipeline by ID")
    public ResponseEntity<Pipeline> getPipelineById(@PathVariable Long id) {
        return ResponseEntity.ok(pipelineService.getPipelineById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FARM_MANAGER', 'FIELD_OPERATOR')")
    @Operation(summary = "Map a new pipeline and calculate its length")
    public ResponseEntity<Pipeline> createPipeline(@Valid @RequestBody PipelineRequest request) {
        return new ResponseEntity<>(pipelineService.createPipeline(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FARM_MANAGER', 'FIELD_OPERATOR')")
    @Operation(summary = "Update a pipeline path and recalculate length")
    public ResponseEntity<Pipeline> updatePipeline(@PathVariable Long id, @Valid @RequestBody PipelineRequest request) {
        return ResponseEntity.ok(pipelineService.updatePipeline(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FARM_MANAGER')")
    @Operation(summary = "Delete a pipeline path")
    public ResponseEntity<Void> deletePipeline(@PathVariable Long id) {
        pipelineService.deletePipeline(id);
        return ResponseEntity.noContent().build();
    }
}
