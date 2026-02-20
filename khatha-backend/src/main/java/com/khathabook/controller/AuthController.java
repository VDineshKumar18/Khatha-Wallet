package com.khathabook.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.khathabook.model.Retailer;
import com.khathabook.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    // ================= SEND OTP =================
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestParam String email) {
        try {
            service.sendOtp(email);
            return ResponseEntity.ok(
                Map.of(
                    "success", true,
                    "message", "OTP sent successfully"
                )
            );
        } catch (RuntimeException ex) {

            if ("RETAILER_NOT_FOUND".equals(ex.getMessage())) {
                return ResponseEntity.status(404).body(
                    Map.of(
                        "success", false,
                        "message", "Email not registered"
                    )
                );
            }

            return ResponseEntity.status(500).body(
                Map.of(
                    "success", false,
                    "message", "Failed to send OTP"
                )
            );
        }
    }

    // ================= VERIFY OTP + LOGIN =================
    // ✅ FIX: READ JSON BODY (NOT @RequestParam)
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {

        String email = body.get("email");
        String otp = body.get("otp");

        try {
            Retailer retailer = service.verifyOtpAndLogin(email, otp);

            return ResponseEntity.ok(
                Map.of(
                    "success", true,
                    "retailerId", retailer.getId(),
                    "email", retailer.getEmail()
                )
            );

        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(
                Map.of(
                    "success", false,
                    "message", ex.getMessage()
                )
            );
        }
    }

    // ================= SIGN UP =================
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Retailer retailer) {

        if (service.retailerExists(retailer.getEmail())) {
            return ResponseEntity.badRequest().body(
                Map.of(
                    "success", false,
                    "message", "Email already registered"
                )
            );
        }

        service.registerRetailer(retailer);

        return ResponseEntity.ok(
            Map.of(
                "success", true,
                "message", "Signup successful"
            )
        );
    }
}
