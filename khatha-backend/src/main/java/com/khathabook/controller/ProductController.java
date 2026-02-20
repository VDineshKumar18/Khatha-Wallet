package com.khathabook.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.khathabook.model.Product;
import com.khathabook.model.ProductCategory;
import com.khathabook.model.Retailer;
import com.khathabook.repository.ProductRepository;
import com.khathabook.repository.RetailerRepository;
import com.khathabook.service.ProductService;
import com.khathabook.service.StockService;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final StockService stockService;
    private final ProductRepository productRepository;
    private final RetailerRepository retailerRepository;

    public ProductController(
            ProductService productService,
            StockService stockService,
            ProductRepository productRepository,
            RetailerRepository retailerRepository
    ) {
        this.productService = productService;
        this.stockService = stockService;
        this.productRepository = productRepository;
        this.retailerRepository = retailerRepository;
    }

    // =================================================
    // ✅ GET PRODUCTS (OPTIONAL CATEGORY FILTER)
    // =================================================
    @GetMapping
    public List<Product> getProducts(
            @RequestParam Long retailerId,
            @RequestParam(required = false) ProductCategory category
    ) {
        if (category != null) {
            return productRepository.findByRetailerIdAndCategory(retailerId, category);
        }
        return productRepository.findByRetailerId(retailerId);
    }
    
    // =================================================
    // ✅ GET ALL PRODUCTS (GLOBAL)
    // =================================================
    // =================================================
    // ✅ GET ALL PRODUCTS (GLOBAL / NEARBY)
    // =================================================
    @GetMapping("/public/all")
    public List<Product> getAllProducts(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng
    ) {
        if (lat != null && lng != null) {
            // Find top 3 nearest retailers within 50km
            // You can adjust the radius (50) and limit (3) as needed
            List<Retailer> nearestRetailers = retailerRepository.findNearestRetailers(lat, lng, 50, 3);
            
            if (nearestRetailers.isEmpty()) {
                return List.of();
            }
            
            return productRepository.findByRetailerIn(nearestRetailers);
        }
        return productRepository.findAll();
    }

    // =================================================
    // ✅ CREATE PRODUCT
    // =================================================
    @PostMapping
    public Product createProduct(
            @RequestBody Product product,
            @RequestParam int boxes,
            @RequestParam Long retailerId
    ) {
        return productService.createProduct(product, boxes, retailerId);
    }

    // =================================================
    // ✅ ADD STOCK
    // =================================================
    @PostMapping("/{id}/add-stock")
    public ResponseEntity<?> addStock(
            @PathVariable Long id,
            @RequestParam int boxes
    ) {
        try {
            return ResponseEntity.ok(stockService.addStockByBoxes(id, boxes));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // =================================================
    // ✅ DELETE PRODUCT
    // =================================================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(
            @PathVariable Long id,
            @RequestParam Long retailerId
    ) {
        try {
            productService.deleteProduct(id, retailerId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Cannot delete product: " + e.getMessage());
        }
    }
    
    
    @PutMapping("/{productId}")
    public ResponseEntity<Product> updateProduct(
            @PathVariable Long productId,
            @RequestBody Product updated
    ) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // ✅ ALLOW SAFE UPDATES
        product.setPrice(updated.getPrice());
        product.setCategory(updated.getCategory());

        // 🔐 CONFIG FIELDS (DO NOT BREAK STOCK LOGIC)
        if ("WEIGHT".equalsIgnoreCase(product.getProductType())) {
            product.setBagSizeKg(updated.getBagSizeKg());
        }

        if ("LIQUID".equalsIgnoreCase(product.getProductType())) {
            product.setPacketsPerBox(updated.getPacketsPerBox());
            product.setPacketSize(updated.getPacketSize());
        }	

        if ("UNIT".equalsIgnoreCase(product.getProductType())) {
            product.setUnitsPerBox(updated.getUnitsPerBox());
        }

        return ResponseEntity.ok(productRepository.save(product));
    }

}
