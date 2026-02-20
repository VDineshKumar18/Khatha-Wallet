package com.khathabook.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.khathabook.model.Product;
import com.khathabook.model.ProductCategory;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByRetailerId(Long retailerId);

    List<Product> findByRetailerIdAndQuantityLessThanEqual(
            Long retailerId,
            double quantity
    );

    // ✅ SINGLE RESULT (preferred when DB is clean)
    Optional<Product> findByBarcodeAndRetailer_Id(
            String barcode,
            Long retailerId
    );
    
 // ✅ ADD THIS METHOD (do NOT remove anything)
    Optional<Product> findTopByNameIgnoreCase(String name);
    
    // ✅ Fuzzy Search for AI
    Optional<Product> findTopByNameContainingIgnoreCase(String name);


    // ✅ MULTI RESULT (fallback for legacy / bad data)
    List<Product> findAllByBarcodeAndRetailer_Id(
            String barcode,
            Long retailerId
    );

    Optional<Product> findByNameIgnoreCaseAndRetailer_Id(
            String name,
            Long retailerId
    );

    List<Product> findByRetailerIdAndCategory(
            Long retailerId,
            ProductCategory category
    );

    // ✅ Find products for multiple retailers (e.g. nearby shops)
    List<Product> findByRetailerIn(List<com.khathabook.model.Retailer> retailers);
    
    List<Product> findByRetailerIdIn(List<Long> retailerIds);
}
