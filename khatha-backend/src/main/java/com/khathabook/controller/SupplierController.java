package com.khathabook.controller;

import com.khathabook.model.Supplier;
import com.khathabook.repository.SupplierRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {

    private final SupplierRepository supplierRepository;

    public SupplierController(SupplierRepository supplierRepository, com.khathabook.repository.SupplierTransactionRepository transactionRepository) {
        this.supplierRepository = supplierRepository;
        this.transactionRepository = transactionRepository;
    }

    // GET all suppliers for a retailer
    @GetMapping
    public ResponseEntity<List<Supplier>> getSuppliers(
            @RequestHeader("X-Retailer-Id") Long retailerId) {
        return ResponseEntity.ok(supplierRepository.findByRetailerId(retailerId));
    }

    // POST create new supplier
    @PostMapping
    public ResponseEntity<Supplier> createSupplier(
            @RequestHeader("X-Retailer-Id") Long retailerId,
            @RequestBody Supplier supplier) {
        supplier.setRetailerId(retailerId);
        return ResponseEntity.ok(supplierRepository.save(supplier));
    }

    // PUT update supplier
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSupplier(
            @RequestHeader("X-Retailer-Id") Long retailerId,
            @PathVariable Long id,
            @RequestBody Supplier updatedSupplier) {
        Supplier existing = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        if (!existing.getRetailerId().equals(retailerId)) {
            return ResponseEntity.status(403).body("Unauthorized");
        }

        existing.setName(updatedSupplier.getName());
        existing.setPhone(updatedSupplier.getPhone());
        existing.setCompany(updatedSupplier.getCompany());
        existing.setEmail(updatedSupplier.getEmail());
        existing.setAddress(updatedSupplier.getAddress());
        existing.setProductsSupplied(updatedSupplier.getProductsSupplied());
        existing.setNotes(updatedSupplier.getNotes());

        return ResponseEntity.ok(supplierRepository.save(existing));
    }

    // DELETE supplier
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSupplier(
            @RequestHeader("X-Retailer-Id") Long retailerId,
            @PathVariable Long id) {
        Supplier existing = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        if (!existing.getRetailerId().equals(retailerId)) {
            return ResponseEntity.status(403).body("Unauthorized");
        }

        supplierRepository.delete(existing);
        return ResponseEntity.ok("Deleted");
    }

    // --- Transactions ---

    private final com.khathabook.repository.SupplierTransactionRepository transactionRepository;

    @GetMapping("/{id}/transactions")
    public ResponseEntity<?> getTransactions(
            @RequestHeader("X-Retailer-Id") Long retailerId,
            @PathVariable Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        if (!supplier.getRetailerId().equals(retailerId)) {
            return ResponseEntity.status(403).body("Unauthorized");
        }

        return ResponseEntity.ok(transactionRepository.findBySupplierIdOrderByTransactionDateDesc(id));
    }

    @PostMapping("/{id}/transact")
    public ResponseEntity<?> addTransaction(
            @RequestHeader("X-Retailer-Id") Long retailerId,
            @PathVariable Long id,
            @RequestBody com.khathabook.model.SupplierTransaction transaction) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        if (!supplier.getRetailerId().equals(retailerId)) {
            return ResponseEntity.status(403).body("Unauthorized");
        }

        // Update Balance
        // If BILL (credit), we owe them -> Balance increases
        // If PAYMENT (debit), we paid them -> Balance decreases
        Double currentBalance = supplier.getBalance() != null ? supplier.getBalance() : 0.0;
        
        if ("BILL".equalsIgnoreCase(transaction.getType())) {
            supplier.setBalance(currentBalance + transaction.getAmount());
        } else if ("PAYMENT".equalsIgnoreCase(transaction.getType())) {
            supplier.setBalance(currentBalance - transaction.getAmount());
        } else {
            return ResponseEntity.badRequest().body("Invalid transaction type. Use BILL or PAYMENT.");
        }

        supplierRepository.save(supplier);

        // Save Transaction
        transaction.setSupplierId(id);
        transaction.setRetailerId(retailerId);
        transaction.setTransactionDate(java.time.LocalDateTime.now());
        
        return ResponseEntity.ok(transactionRepository.save(transaction));
    }
}
