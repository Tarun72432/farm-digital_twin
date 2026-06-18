package com.company.farmdigitaltwin.repository;

import com.company.farmdigitaltwin.entity.Tank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TankRepository extends JpaRepository<Tank, Long> {
    List<Tank> findByFarmId(Long farmId);
}
