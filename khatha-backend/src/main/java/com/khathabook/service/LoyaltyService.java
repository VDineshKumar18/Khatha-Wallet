package com.khathabook.service;

import com.khathabook.model.Customer;
import com.khathabook.repository.CustomerRepository;
import org.springframework.stereotype.Service;

@Service
public class LoyaltyService {

    private final CustomerRepository customerRepository;

    public LoyaltyService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    // ================= REDEEM LOYALTY POINTS =================
    public LoyaltyRedeemResponse redeemPoints(
            Long customerId,
            Long retailerId,
            int points
    ) {

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        // 🔒 Security check
        if (!customer.getRetailer().getId().equals(retailerId)) {
            throw new RuntimeException("Unauthorized");
        }

        if (points <= 0) {
            throw new RuntimeException("Invalid points");
        }

        if (customer.getLoyaltyPoints() < points) {
            throw new RuntimeException("Insufficient loyalty points");
        }

        // 🔥 Redeem
        customer.setLoyaltyPoints(customer.getLoyaltyPoints() - points);
        customerRepository.save(customer);

        return new LoyaltyRedeemResponse(
                true,
                points,
                points, // 1 point = ₹1
                customer.getLoyaltyPoints()
        );
    }

    // ================= RESPONSE DTO =================
    public record LoyaltyRedeemResponse(
            boolean success,
            int redeemedPoints,
            int discountAmount,
            int remainingPoints
    ) {}
}
