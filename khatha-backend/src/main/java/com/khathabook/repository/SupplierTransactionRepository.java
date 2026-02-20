package com.khathabook.repository;

import com.khathabook.model.SupplierTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SupplierTransactionRepository extends JpaRepository<SupplierTransaction, Long> {
    List<SupplierTransaction> findBySupplierIdOrderByTransactionDateDesc(Long supplierId);
}
