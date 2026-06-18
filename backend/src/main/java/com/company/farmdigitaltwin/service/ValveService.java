package com.company.farmdigitaltwin.service;

import com.company.farmdigitaltwin.dto.ValveRequest;
import com.company.farmdigitaltwin.entity.Farm;
import com.company.farmdigitaltwin.entity.Valve;
import com.company.farmdigitaltwin.exception.ResourceNotFoundException;
import com.company.farmdigitaltwin.repository.FarmRepository;
import com.company.farmdigitaltwin.repository.ValveRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ValveService {

    private final ValveRepository valveRepository;
    private final FarmRepository farmRepository;

    public ValveService(ValveRepository valveRepository, FarmRepository farmRepository) {
        this.valveRepository = valveRepository;
        this.farmRepository = farmRepository;
    }

    @Transactional(readOnly = true)
    public List<Valve> getAllValves() {
        return valveRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Valve> getValvesByFarm(Long farmId) {
        return valveRepository.findByFarmId(farmId);
    }

    @Transactional(readOnly = true)
    public Valve getValveById(Long id) {
        return valveRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Valve", "id", id));
    }

    @Transactional
    public Valve createValve(ValveRequest request) {
        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", request.getFarmId()));

        Valve valve = Valve.builder()
                .farm(farm)
                .valveNumber(request.getValveNumber())
                .type(request.getType())
                .zone(request.getZone())
                .status(request.getStatus() != null ? request.getStatus() : "CLOSED")
                .geometry(request.getGeometry())
                .photoUrl(request.getPhotoUrl())
                .build();

        return valveRepository.save(valve);
    }

    @Transactional
    public Valve updateValve(Long id, ValveRequest request) {
        Valve valve = getValveById(id);
        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", request.getFarmId()));

        valve.setFarm(farm);
        valve.setValveNumber(request.getValveNumber());
        valve.setType(request.getType());
        valve.setZone(request.getZone());
        if (request.getStatus() != null) valve.setStatus(request.getStatus());
        valve.setGeometry(request.getGeometry());
        valve.setPhotoUrl(request.getPhotoUrl());

        return valveRepository.save(valve);
    }

    @Transactional
    public void deleteValve(Long id) {
        Valve valve = getValveById(id);
        valveRepository.delete(valve);
    }
}
