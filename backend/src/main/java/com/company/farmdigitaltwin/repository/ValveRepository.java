package com.company.farmdigitaltwin.repository;

import com.company.farmdigitaltwin.entity.Valve;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ValveRepository extends JpaRepository<Valve, Long> {
    List<Valve> findByFarmId(Long farmId);
}
