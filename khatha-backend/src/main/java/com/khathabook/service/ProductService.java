package com.khathabook.service;

import org.springframework.stereotype.Service;

import com.khathabook.model.Product;
import com.khathabook.model.Retailer;
import com.khathabook.repository.ProductRepository;
import com.khathabook.repository.RetailerRepository;

@Service
public class ProductService {

    private final ProductRepository productRepo;
    private final RetailerRepository retailerRepo;

    public ProductService(ProductRepository productRepo,
                          RetailerRepository retailerRepo) {
        this.productRepo = productRepo;
        this.retailerRepo = retailerRepo;
    }

    // =================================================
    // ✅ CREATE PRODUCT WITH INITIAL STOCK
    // =================================================
    public Product createProduct(Product product, int boxes, Long retailerId) {

        Retailer retailer = retailerRepo.findById(retailerId)
                .orElseThrow(() -> new RuntimeException("Retailer not found"));

        if (product.getCategory() == null) {
            throw new RuntimeException("Category is required");
        }

        product.setRetailer(retailer);
        
        // Use provided barcode or generate one
        if (product.getBarcode() == null || product.getBarcode().trim().isEmpty()) {
            product.setBarcode("PRD-" + System.currentTimeMillis());
        }

        double stock;

        switch (product.getProductType()) {

            case "WEIGHT" -> {
                if (product.getBagSizeKg() == null)
                    throw new RuntimeException("Bag size missing");
                stock = boxes * product.getBagSizeKg();
            }

            case "LIQUID" -> {
                if (product.getPacketsPerBox() == null || product.getPacketSize() == null)
                    throw new RuntimeException("Liquid config missing");
                stock = boxes * product.getPacketsPerBox() * product.getPacketSize();
            }

            case "UNIT" -> {
                if (product.getUnitsPerBox() == null)
                    throw new RuntimeException("Units per box missing");
                stock = boxes * product.getUnitsPerBox();
            }

            default -> throw new RuntimeException("Invalid product type");
        }

        product.setQuantity(stock);
        return productRepo.save(product);
    }

    // =================================================
    // ✅ DELETE PRODUCT
    // =================================================
    public void deleteProduct(Long productId, Long retailerId) {

        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!product.getRetailer().getId().equals(retailerId)) {
            throw new RuntimeException("Unauthorized delete");
        }

        productRepo.delete(product);
    }
}
