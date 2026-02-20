package com.khathabook.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.khathabook.model.Product;
import com.khathabook.repository.ProductRepository;

@Service
public class StockService {

    private final ProductRepository productRepository;

    public StockService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    // =============================
    // ✅ GET ALL STOCK
    // =============================
    public List<Product> getAllStock(Long retailerId) {
        return productRepository.findByRetailerId(retailerId);
    }

    // =============================
    // ✅ LOW STOCK ALERT
    // =============================
    public List<Product> getLowStock(Long retailerId, int threshold) {
        return productRepository
                .findByRetailerIdAndQuantityLessThanEqual(retailerId, threshold);
    }

    // =============================
    // ✅ UPDATE STOCK DIRECTLY
    // =============================
    public Product updateStock(Long productId, int quantity, Long retailerId) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // 🔐 Retailer ownership check
        if (!product.getRetailer().getId().equals(retailerId)) {
            throw new RuntimeException("Unauthorized stock update");
        }

        product.setQuantity(quantity);
        return productRepository.save(product);
    }

    // =============================
    // ✅ ADD STOCK BY BOXES / BAGS
    // =============================
    public Product addStockByBoxes(Long productId, int boxes) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        System.out.println("DEBUG: Adding stock for " + product.getName() + " (" + product.getProductType() + ")");
        System.out.println("DEBUG: Boxes: " + boxes);
        System.out.println("DEBUG: Config -> Bag: " + product.getBagSizeKg() + ", Packets: " + product.getPacketsPerBox() + ", PacketSize: " + product.getPacketSize());

        if (boxes <= 0) {
            throw new RuntimeException("Boxes must be greater than 0");
        }

        double addedStock;

        switch (product.getProductType()) {

            case "WEIGHT" -> {
                if (product.getBagSizeKg() == null || product.getBagSizeKg() <= 0) {
                    throw new RuntimeException(
                        "Bag size not configured. Edit product first."
                    );
                }
                addedStock = boxes * product.getBagSizeKg();
            }

            case "LIQUID" -> {
                if (product.getPacketsPerBox() == null ||
                    product.getPacketSize() == null ||
                    product.getPacketsPerBox() <= 0 ||
                    product.getPacketSize() <= 0) {

                    throw new RuntimeException(
                        "Liquid configuration missing. Edit product first."
                    );
                }
                addedStock = boxes * product.getPacketsPerBox() * product.getPacketSize();
            }

            case "UNIT" -> {
                if (product.getUnitsPerBox() == null || product.getUnitsPerBox() <= 0) {
                    throw new RuntimeException(
                        "Units per box not configured. Edit product first."
                    );
                }
                addedStock = boxes * product.getUnitsPerBox();
            }

            default -> throw new RuntimeException("Invalid product type");
        }

        product.setQuantity(product.getQuantity() + addedStock);
        return productRepository.save(product);
    }
}
