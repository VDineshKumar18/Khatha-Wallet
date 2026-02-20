package com.khathabook.controller;

import com.khathabook.model.Bill;
import com.khathabook.service.RefundService;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/refunds")
@CrossOrigin
public class RefundController {

    private final RefundService refundService;

    public RefundController(RefundService refundService) {
        this.refundService = refundService;
    }

    // ================= REFUND BILL =================
    @PostMapping("/{billId}")
    public Bill refundBill(
            @PathVariable Long billId,
            @RequestHeader("X-Retailer-Id") Long retailerId
    ) {
        return refundService.refundBill(billId, retailerId);
    }
}
