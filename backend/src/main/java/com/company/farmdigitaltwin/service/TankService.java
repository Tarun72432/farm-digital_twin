package com.company.farmdigitaltwin.service;

import com.company.farmdigitaltwin.dto.TankRequest;
import com.company.farmdigitaltwin.entity.Farm;
import com.company.farmdigitaltwin.entity.Tank;
import com.company.farmdigitaltwin.exception.ResourceNotFoundException;
import com.company.farmdigitaltwin.repository.FarmRepository;
import com.company.farmdigitaltwin.repository.TankRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TankService {

    private final TankRepository tankRepository;
    private final FarmRepository farmRepository;

    public TankService(TankRepository tankRepository, FarmRepository farmRepository) {
        this.tankRepository = tankRepository;
        this.farmRepository = farmRepository;
    }

    @Transactional(readOnly = true)
    public List<Tank> getAllTanks() {
        return tankRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Tank> getTanksByFarm(Long farmId) {
        return tankRepository.findByFarmId(farmId);
    }

    @Transactional(readOnly = true)
    public Tank getTankById(Long id) {
        return tankRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tank", "id", id));
    }

    @Transactional
    public Tank createTank(TankRequest request) {
        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", request.getFarmId()));

        Tank tank = Tank.builder()
                .farm(farm)
                .name(request.getName())
                .capacity(request.getCapacity())
                .material(request.getMaterial())
                .height(request.getHeight())
                .status(request.getStatus() != null ? request.getStatus() : "OPERATIONAL")
                .geometry(request.getGeometry())
                .photoUrl(request.getPhotoUrl())
                .build();

        return tankRepository.save(tank);
    }

    @Transactional
    public Tank updateTank(Long id, TankRequest request) {
        Tank tank = getTankById(id);
        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", request.getFarmId()));

        tank.setFarm(farm);
        tank.setName(request.getName());
        tank.setCapacity(request.getCapacity());
        tank.setMaterial(request.getMaterial());
        tank.setHeight(request.getHeight());
        if (request.getStatus() != null) tank.setStatus(request.getStatus());
        tank.setGeometry(request.getGeometry());
        tank.setPhotoUrl(request.getPhotoUrl());

        return tankRepository.save(tank);
    }

    @Transactional
    public void deleteTank(Long id) {
        Tank tank = getTankById(id);
        tankRepository.delete(tank);
    }
}
