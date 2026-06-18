package com.company.farmdigitaltwin.service;

import com.company.farmdigitaltwin.dto.PumpRequest;
import com.company.farmdigitaltwin.entity.Farm;
import com.company.farmdigitaltwin.entity.Pump;
import com.company.farmdigitaltwin.exception.ResourceNotFoundException;
import com.company.farmdigitaltwin.repository.FarmRepository;
import com.company.farmdigitaltwin.repository.PumpRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PumpService {

    private final PumpRepository pumpRepository;
    private final FarmRepository farmRepository;

    public PumpService(PumpRepository pumpRepository, FarmRepository farmRepository) {
        this.pumpRepository = pumpRepository;
        this.farmRepository = farmRepository;
    }

    @Transactional(readOnly = true)
    public List<Pump> getAllPumps() {
        return pumpRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Pump> getPumpsByFarm(Long farmId) {
        return pumpRepository.findByFarmId(farmId);
    }

    @Transactional(readOnly = true)
    public Pump getPumpById(Long id) {
        return pumpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pump", "id", id));
    }

    @Transactional
    public Pump createPump(PumpRequest request) {
        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", request.getFarmId()));

        Pump pump = Pump.builder()
                .farm(farm)
                .name(request.getName())
                .capacity(request.getCapacity())
                .powerRating(request.getPowerRating())
                .manufacturer(request.getManufacturer())
                .status(request.getStatus() != null ? request.getStatus() : "OFF")
                .geometry(request.getGeometry())
                .photoUrl(request.getPhotoUrl())
                .build();

        return pumpRepository.save(pump);
    }

    @Transactional
    public Pump updatePump(Long id, PumpRequest request) {
        Pump pump = getPumpById(id);
        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", request.getFarmId()));

        pump.setFarm(farm);
        pump.setName(request.getName());
        pump.setCapacity(request.getCapacity());
        pump.setPowerRating(request.getPowerRating());
        pump.setManufacturer(request.getManufacturer());
        if (request.getStatus() != null) pump.setStatus(request.getStatus());
        pump.setGeometry(request.getGeometry());
        pump.setPhotoUrl(request.getPhotoUrl());

        return pumpRepository.save(pump);
    }

    @Transactional
    public void deletePump(Long id) {
        Pump pump = getPumpById(id);
        pumpRepository.delete(pump);
    }
}
