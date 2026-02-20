package com.khathabook.repository;

import com.khathabook.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    List<Supplier> findByRetailerId(Long retailerId);
}
