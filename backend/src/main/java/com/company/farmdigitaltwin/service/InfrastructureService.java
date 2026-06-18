package com.company.farmdigitaltwin.service;

import com.company.farmdigitaltwin.dto.InfrastructureRequest;
import com.company.farmdigitaltwin.entity.Farm;
import com.company.farmdigitaltwin.entity.Infrastructure;
import com.company.farmdigitaltwin.exception.ResourceNotFoundException;
import com.company.farmdigitaltwin.repository.FarmRepository;
import com.company.farmdigitaltwin.repository.InfrastructureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InfrastructureService {

    private final InfrastructureRepository infrastructureRepository;
    private final FarmRepository farmRepository;

    public InfrastructureService(InfrastructureRepository infrastructureRepository, FarmRepository farmRepository) {
        this.infrastructureRepository = infrastructureRepository;
        this.farmRepository = farmRepository;
    }

    @Transactional(readOnly = true)
    public List<Infrastructure> getAllInfrastructure() {
        return infrastructureRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Infrastructure> getInfrastructureByFarm(Long farmId) {
        return infrastructureRepository.findByFarmId(farmId);
    }

    @Transactional(readOnly = true)
    public Infrastructure getInfrastructureById(Long id) {
        return infrastructureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Infrastructure", "id", id));
    }

    @Transactional
    public Infrastructure createInfrastructure(InfrastructureRequest request) {
        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", request.getFarmId()));

        Infrastructure infra = Infrastructure.builder()
                .farm(farm)
                .name(request.getName())
                .type(request.getType())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .geometry(request.getGeometry())
                .photoUrl(request.getPhotoUrl())
                .build();

        return infrastructureRepository.save(infra);
    }

    @Transactional
    public Infrastructure updateInfrastructure(Long id, InfrastructureRequest request) {
        Infrastructure infra = getInfrastructureById(id);
        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", request.getFarmId()));

        infra.setFarm(farm);
        infra.setName(request.getName());
        infra.setType(request.getType());
        if (request.getStatus() != null) infra.setStatus(request.getStatus());
        infra.setGeometry(request.getGeometry());
        infra.setPhotoUrl(request.getPhotoUrl());

        return infrastructureRepository.save(infra);
    }

    @Transactional
    public void deleteInfrastructure(Long id) {
        Infrastructure infra = getInfrastructureById(id);
        infrastructureRepository.delete(infra);
    }
}
