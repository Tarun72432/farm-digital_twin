package com.company.farmdigitaltwin.service;

import com.company.farmdigitaltwin.dto.FarmRequest;
import com.company.farmdigitaltwin.entity.Farm;
import com.company.farmdigitaltwin.exception.ResourceNotFoundException;
import com.company.farmdigitaltwin.gis.GisUtils;
import com.company.farmdigitaltwin.repository.FarmRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FarmService {

    private final FarmRepository farmRepository;

    public FarmService(FarmRepository farmRepository) {
        this.farmRepository = farmRepository;
    }

    @Transactional(readOnly = true)
    public List<Farm> getAllFarms() {
        return farmRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Farm getFarmById(Long id) {
        return farmRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", id));
    }

    @Transactional
    public Farm createFarm(FarmRequest request) {
        double calculatedArea = GisUtils.calculateAreaInHectares(request.getBoundary());
        
        Farm farm = Farm.builder()
                .name(request.getName())
                .ownerName(request.getOwnerName())
                .description(request.getDescription())
                .area(calculatedArea)
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .boundary(request.getBoundary())
                .build();
                
        return farmRepository.save(farm);
    }

    @Transactional
    public Farm updateFarm(Long id, FarmRequest request) {
        Farm farm = getFarmById(id);
        
        double calculatedArea = GisUtils.calculateAreaInHectares(request.getBoundary());
        
        farm.setName(request.getName());
        farm.setOwnerName(request.getOwnerName());
        farm.setDescription(request.getDescription());
        farm.setArea(calculatedArea);
        if (request.getStatus() != null) {
            farm.setStatus(request.getStatus());
        }
        farm.setBoundary(request.getBoundary());
        
        return farmRepository.save(farm);
    }

    @Transactional
    public void deleteFarm(Long id) {
        Farm farm = getFarmById(id);
        farmRepository.delete(farm);
    }
}
