package com.khathabook.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.khathabook.model.Payment;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    // ✅ REQUIRED FOR CUSTOMER-WISE PAYMENTS
    List<Payment> findByCustomerId(Long customerId);
}
