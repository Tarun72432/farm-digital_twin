package com.company.farmdigitaltwin.repository;

import com.company.farmdigitaltwin.entity.Tree;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TreeRepository extends JpaRepository<Tree, Long> {
    List<Tree> findByFarmId(Long farmId);
    long countByFarmId(Long farmId);
}
