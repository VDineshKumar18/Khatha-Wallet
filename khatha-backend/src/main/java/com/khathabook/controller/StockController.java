package com.khathabook.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.khathabook.model.Product;
import com.khathabook.service.StockService;

@RestController
@RequestMapping("/api/stock")
public class StockController {

    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    // =============================
    // ✅ GET ALL STOCK
    // =============================
    @GetMapping
    public List<Product> getAllStock(
            @RequestHeader("X-Retailer-Id") Long retailerId) {

        return stockService.getAllStock(retailerId);
    }

    // =============================
    // ✅ LOW STOCK ALERT
    // =============================
    @GetMapping("/low")
    public List<Product> getLowStock(
            @RequestHeader("X-Retailer-Id") Long retailerId,
            @RequestParam(defaultValue = "5") int threshold) {

        return stockService.getLowStock(retailerId, threshold);
    }

    // =============================
    // ✅ UPDATE STOCK MANUALLY
    // =============================
    @PutMapping("/{productId}")
    public Product updateStock(
            @PathVariable Long productId,
            @RequestParam int quantity,
            @RequestHeader("X-Retailer-Id") Long retailerId) {

        return stockService.updateStock(productId, quantity, retailerId);
    }
}
