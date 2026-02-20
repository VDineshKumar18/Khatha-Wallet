package com.khathabook.controller;

import com.khathabook.service.BillNotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class BillNotificationController {

    private final BillNotificationService service;

    public BillNotificationController(BillNotificationService service) {
        this.service = service;
    }

    /**
     * SEND BILL VIA SMS / WHATSAPP
     */
    @PostMapping("/bill/{billId}")
    public ResponseEntity<?> sendBill(
            @PathVariable Long billId,
            @RequestHeader("X-Retailer-Id") Long retailerId,
            @RequestParam String phone,
            @RequestParam String channel   // SMS or WHATSAPP
    ) {

        String message =
                service.generateBillMessage(billId, retailerId);

        // 🔥 TEMP: PRINT MESSAGE (Later integrate Twilio)
        System.out.println("=================================");
        System.out.println("SEND VIA : " + channel);
        System.out.println("PHONE    : " + phone);
        System.out.println(message);
        System.out.println("=================================");

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "channel", channel,
                        "phone", phone,
                        "message", "Bill sent successfully"
                )
        );
    }
}
