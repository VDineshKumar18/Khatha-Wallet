package com.khathabook.controller;

import com.khathabook.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notify")
@CrossOrigin(origins = "http://localhost:5173")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping("/{customerId}")
    public ResponseEntity<String> notifyCustomer(
            @PathVariable Long customerId,
            @RequestHeader("X-Retailer-Id") Long retailerId
    ) {
        notificationService.sendDueAmountEmail(customerId, retailerId);
        return ResponseEntity.ok("Notification sent");
    }
}
