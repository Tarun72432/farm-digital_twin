package com.company.farmdigitaltwin.repository;

import com.company.farmdigitaltwin.entity.Pump;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PumpRepository extends JpaRepository<Pump, Long> {
    List<Pump> findByFarmId(Long farmId);
}
