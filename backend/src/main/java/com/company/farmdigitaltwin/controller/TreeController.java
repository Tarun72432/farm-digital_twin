package com.company.farmdigitaltwin.controller;

import com.company.farmdigitaltwin.dto.TreeRequest;
import com.company.farmdigitaltwin.entity.Tree;
import com.company.farmdigitaltwin.service.TreeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trees")
@Tag(name = "Trees", description = "Endpoints for Individual Moringa Tree Inventory")
public class TreeController {

    private final TreeService treeService;

    public TreeController(TreeService treeService) {
        this.treeService = treeService;
    }

    @GetMapping
    @Operation(summary = "Get all trees")
    public ResponseEntity<List<Tree>> getAllTrees() {
        return ResponseEntity.ok(treeService.getAllTrees());
    }

    @GetMapping("/farm/{farmId}")
    @Operation(summary = "Get all trees mapped to a specific farm")
    public ResponseEntity<List<Tree>> getTreesByFarm(@PathVariable Long farmId) {
        return ResponseEntity.ok(treeService.getTreesByFarm(farmId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a tree by ID")
    public ResponseEntity<Tree> getTreeById(@PathVariable Long id) {
        return ResponseEntity.ok(treeService.getTreeById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FARM_MANAGER', 'FIELD_OPERATOR')")
    @Operation(summary = "Register a new tree")
    public ResponseEntity<Tree> createTree(@Valid @RequestBody TreeRequest request) {
        return new ResponseEntity<>(treeService.createTree(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FARM_MANAGER', 'FIELD_OPERATOR')")
    @Operation(summary = "Update an existing tree's logs")
    public ResponseEntity<Tree> updateTree(@PathVariable Long id, @Valid @RequestBody TreeRequest request) {
        return ResponseEntity.ok(treeService.updateTree(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FARM_MANAGER')")
    @Operation(summary = "Delete a tree record")
    public ResponseEntity<Void> deleteTree(@PathVariable Long id) {
        treeService.deleteTree(id);
        return ResponseEntity.noContent().build();
    }
}
