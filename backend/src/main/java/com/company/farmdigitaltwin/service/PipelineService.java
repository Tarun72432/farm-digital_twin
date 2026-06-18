package com.company.farmdigitaltwin.service;

import com.company.farmdigitaltwin.dto.PipelineRequest;
import com.company.farmdigitaltwin.entity.Farm;
import com.company.farmdigitaltwin.entity.Pipeline;
import com.company.farmdigitaltwin.exception.ResourceNotFoundException;
import com.company.farmdigitaltwin.gis.GisUtils;
import com.company.farmdigitaltwin.repository.FarmRepository;
import com.company.farmdigitaltwin.repository.PipelineRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PipelineService {

    private final PipelineRepository pipelineRepository;
    private final FarmRepository farmRepository;

    public PipelineService(PipelineRepository pipelineRepository, FarmRepository farmRepository) {
        this.pipelineRepository = pipelineRepository;
        this.farmRepository = farmRepository;
    }

    @Transactional(readOnly = true)
    public List<Pipeline> getAllPipelines() {
        return pipelineRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Pipeline> getPipelinesByFarm(Long farmId) {
        return pipelineRepository.findByFarmId(farmId);
    }

    @Transactional(readOnly = true)
    public Pipeline getPipelineById(Long id) {
        return pipelineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pipeline", "id", id));
    }

    @Transactional
    public Pipeline createPipeline(PipelineRequest request) {
        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", request.getFarmId()));

        double calculatedLength = GisUtils.calculateLengthInMeters(request.getGeometry());

        Pipeline pipeline = Pipeline.builder()
                .farm(farm)
                .name(request.getName())
                .diameter(request.getDiameter())
                .material(request.getMaterial())
                .length(calculatedLength)
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .geometry(request.getGeometry())
                .build();

        return pipelineRepository.save(pipeline);
    }

    @Transactional
    public Pipeline updatePipeline(Long id, PipelineRequest request) {
        Pipeline pipeline = getPipelineById(id);
        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", request.getFarmId()));

        double calculatedLength = GisUtils.calculateLengthInMeters(request.getGeometry());

        pipeline.setFarm(farm);
        pipeline.setName(request.getName());
        pipeline.setDiameter(request.getDiameter());
        pipeline.setMaterial(request.getMaterial());
        pipeline.setLength(calculatedLength);
        if (request.getStatus() != null) pipeline.setStatus(request.getStatus());
        pipeline.setGeometry(request.getGeometry());

        return pipelineRepository.save(pipeline);
    }

    @Transactional
    public void deletePipeline(Long id) {
        Pipeline pipeline = getPipelineById(id);
        pipelineRepository.delete(pipeline);
    }
}
