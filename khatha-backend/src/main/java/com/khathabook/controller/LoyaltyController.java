package com.khathabook.controller;

import com.khathabook.service.LoyaltyService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/loyalty")
@CrossOrigin
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    public LoyaltyController(LoyaltyService loyaltyService) {
        this.loyaltyService = loyaltyService;
    }

    // ================= REDEEM ENDPOINT =================
    @PostMapping("/redeem/{customerId}")
    public Object redeemLoyaltyPoints(
            @PathVariable Long customerId,
            @RequestHeader("X-Retailer-Id") Long retailerId,
            @RequestBody Map<String, Integer> body
    ) {
        int points = body.getOrDefault("points", 0);

        return loyaltyService.redeemPoints(
                customerId,
                retailerId,
                points
        );
    }
}
