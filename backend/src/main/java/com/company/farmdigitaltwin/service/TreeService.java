package com.company.farmdigitaltwin.service;

import com.company.farmdigitaltwin.dto.TreeRequest;
import com.company.farmdigitaltwin.entity.Farm;
import com.company.farmdigitaltwin.entity.Tree;
import com.company.farmdigitaltwin.exception.ResourceNotFoundException;
import com.company.farmdigitaltwin.repository.FarmRepository;
import com.company.farmdigitaltwin.repository.TreeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TreeService {

    private final TreeRepository treeRepository;
    private final FarmRepository farmRepository;

    public TreeService(TreeRepository treeRepository, FarmRepository farmRepository) {
        this.treeRepository = treeRepository;
        this.farmRepository = farmRepository;
    }

    @Transactional(readOnly = true)
    public List<Tree> getAllTrees() {
        return treeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Tree> getTreesByFarm(Long farmId) {
        return treeRepository.findByFarmId(farmId);
    }

    @Transactional(readOnly = true)
    public Tree getTreeById(Long id) {
        return treeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tree", "id", id));
    }

    @Transactional
    public Tree createTree(TreeRequest request) {
        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", request.getFarmId()));

        Tree tree = Tree.builder()
                .farm(farm)
                .treeNumber(request.getTreeNumber())
                .species(request.getSpecies() != null ? request.getSpecies() : "Moringa Oleifera")
                .age(request.getAge())
                .healthStatus(request.getHealthStatus() != null ? request.getHealthStatus() : "HEALTHY")
                .location(request.getLocation())
                .photoUrl(request.getPhotoUrl())
                .notes(request.getNotes())
                .build();

        return treeRepository.save(tree);
    }

    @Transactional
    public Tree updateTree(Long id, TreeRequest request) {
        Tree tree = getTreeById(id);
        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", request.getFarmId()));

        tree.setFarm(farm);
        tree.setTreeNumber(request.getTreeNumber());
        if (request.getSpecies() != null) tree.setSpecies(request.getSpecies());
        tree.setAge(request.getAge());
        if (request.getHealthStatus() != null) tree.setHealthStatus(request.getHealthStatus());
        tree.setLocation(request.getLocation());
        tree.setPhotoUrl(request.getPhotoUrl());
        tree.setNotes(request.getNotes());

        return treeRepository.save(tree);
    }

    @Transactional
    public void deleteTree(Long id) {
        Tree tree = getTreeById(id);
        treeRepository.delete(tree);
    }
}
