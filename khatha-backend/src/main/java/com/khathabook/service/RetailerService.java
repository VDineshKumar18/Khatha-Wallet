package com.khathabook.service;

import com.khathabook.model.Retailer;
import com.khathabook.repository.RetailerRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class RetailerService {

    private final RetailerRepository retailerRepository;

    public RetailerService(RetailerRepository retailerRepository) {
        this.retailerRepository = retailerRepository;
    }

    public Retailer getProfile(Long id) {
        return retailerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Retailer not found"));
    }

    public Retailer updateProfile(Long id, Retailer updatedData) {
        Retailer retailer = getProfile(id);

        if (updatedData.getName() != null) retailer.setName(updatedData.getName());
        if (updatedData.getPhone() != null) retailer.setPhone(updatedData.getPhone());
        if (updatedData.getUpiId() != null) retailer.setUpiId(updatedData.getUpiId());
        if (updatedData.getPayeeName() != null) retailer.setPayeeName(updatedData.getPayeeName());
        
        // innovative: handle email updates if needed, but usually email is identity.
        // Let's keep email immutable for simplicity or handle it carefully with unique checks.
        // For now, only name/phone as requested.

        return retailerRepository.save(retailer);
    }
}
