package com.khathabook.service;

import java.time.LocalDateTime;
import java.util.Random;

import org.springframework.stereotype.Service;

import com.khathabook.model.Otp;
import com.khathabook.model.Retailer;
import com.khathabook.repository.OtpRepository;
import com.khathabook.repository.RetailerRepository;

@Service
public class AuthService {

    private final OtpRepository otpRepo;
    private final RetailerRepository retailerRepo;
    private final NotificationService notificationService;

    public AuthService(
            OtpRepository otpRepo,
            RetailerRepository retailerRepo,
            NotificationService notificationService
    ) {
        this.otpRepo = otpRepo;
        this.retailerRepo = retailerRepo;
        this.notificationService = notificationService;
    }

    // ================= SEND OTP =================
    public void sendOtp(String email) {

        retailerRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("RETAILER_NOT_FOUND"));

        String otp = String.valueOf(100000 + new Random().nextInt(900000));

        otpRepo.findByEmail(email).ifPresent(otpRepo::delete);

        Otp entity = new Otp();
        entity.setEmail(email);
        entity.setOtp(otp);
        entity.setExpiryTime(LocalDateTime.now().plusMinutes(5));

        otpRepo.save(entity);

        notificationService.sendOtpEmail(email, otp);
    }

    // ================= VERIFY OTP + LOGIN =================
    public Retailer verifyOtpAndLogin(String email, String otp) {

        Otp savedOtp = otpRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("OTP_NOT_FOUND"));

        if (savedOtp.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP_EXPIRED");
        }

        if (!savedOtp.getOtp().equals(otp)) {
            throw new RuntimeException("INVALID_OTP");
        }

        // OTP USED → DELETE
        otpRepo.delete(savedOtp);

        return retailerRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("RETAILER_NOT_FOUND"));
    }

    // ================= SIGNUP =================
    public boolean retailerExists(String email) {
        return retailerRepo.findByEmail(email).isPresent();
    }

    public Retailer registerRetailer(Retailer retailer) {
        return retailerRepo.save(retailer);
    }
}
