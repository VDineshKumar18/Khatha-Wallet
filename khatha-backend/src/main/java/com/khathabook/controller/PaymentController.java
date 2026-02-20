package com.khathabook.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.khathabook.model.Payment;
import com.khathabook.service.PaymentService;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "http://localhost:5173")
public class PaymentController {

    private final PaymentService paymentService;

    // ✅ CONSTRUCTOR INJECTION (IMPORTANT)
    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    // ✅ CREATE PAYMENT
    @PostMapping("/{customerId}")
    public Payment makePayment(
            @PathVariable Long customerId,
            @RequestBody Payment payment) {

        return paymentService.makePayment(customerId,customerId, payment);
    }

    // ✅ GET ALL PAYMENTS
    @GetMapping
    public List<Payment> getAllPayments() {
        return paymentService.getAllPayments();
    }

    // ✅ GET PAYMENTS BY CUSTOMER
    @GetMapping("/customer/{customerId}")
    public List<Payment> getPaymentsByCustomer(
            @PathVariable Long customerId) {

        return paymentService.getPaymentsByCustomer(customerId);
    }
}
