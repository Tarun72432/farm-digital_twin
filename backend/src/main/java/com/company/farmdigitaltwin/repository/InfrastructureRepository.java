package com.company.farmdigitaltwin.repository;

import com.company.farmdigitaltwin.entity.Infrastructure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InfrastructureRepository extends JpaRepository<Infrastructure, Long> {
    List<Infrastructure> findByFarmId(Long farmId);
}
