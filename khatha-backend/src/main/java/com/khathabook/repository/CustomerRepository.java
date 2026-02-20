package com.khathabook.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.khathabook.model.Customer;
import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByPhoneAndRetailerId(String phone, Long retailerId);

    Optional<Customer> findByEmailAndRetailerId(String email, Long retailerId);

    List<Customer> findByRetailerId(Long retailerId);

    // ✅ Find all customer records by phone (for Customer App Login)
    List<Customer> findByPhone(String phone);

    // ✅ Find all customer records by email (for Unified Login)
    List<Customer> findByEmail(String email);
}
