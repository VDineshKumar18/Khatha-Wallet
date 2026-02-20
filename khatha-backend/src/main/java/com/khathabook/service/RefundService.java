package com.khathabook.service;

import com.khathabook.model.Bill;
import com.khathabook.model.Product;
import com.khathabook.repository.BillRepository;
import com.khathabook.repository.ProductRepository;
import org.springframework.stereotype.Service;

@Service
public class RefundService {

    private final BillRepository billRepository;
    private final ProductRepository productRepository;

    public RefundService(BillRepository billRepository,
                         ProductRepository productRepository) {
        this.billRepository = billRepository;
        this.productRepository = productRepository;
    }

    public Bill refundBill(Long billId, Long retailerId) {

        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        if (!bill.getRetailer().getId().equals(retailerId)) {
            throw new RuntimeException("Unauthorized refund attempt");
        }

        if ("REFUNDED".equalsIgnoreCase(bill.getStatus())) {
            throw new RuntimeException("Bill already refunded");
        }

        // 🔄 RESTORE STOCK
        restoreStockFromBill(bill.getItems(), retailerId);

        // 🔄 UPDATE BILL STATUS
        bill.setStatus("REFUNDED");
        bill.setPaid(false);
        bill.setDueAmount(0);

        return billRepository.save(bill);
    }

    private void restoreStockFromBill(String items, Long retailerId) {

        if (items == null || items.isEmpty()) return;

        String[] productItems = items.split(",");

        for (String item : productItems) {

            String[] parts = item.trim().split(" x");
            if (parts.length != 2) continue;

            String productName = parts[0].trim();
            int qty = Integer.parseInt(parts[1].trim());

            Product product = productRepository
                    .findByRetailerId(retailerId)
                    .stream()
                    .filter(p -> p.getName().equalsIgnoreCase(productName))
                    .findFirst()
                    .orElseThrow(() ->
                            new RuntimeException("Product not found: " + productName));

            product.setQuantity(product.getQuantity() + qty);
            productRepository.save(product);
        }
    }
}
