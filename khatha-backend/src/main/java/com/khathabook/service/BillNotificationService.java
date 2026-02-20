package com.khathabook.service;

import com.khathabook.model.Bill;
import com.khathabook.repository.BillRepository;
import org.springframework.stereotype.Service;

@Service
public class BillNotificationService {

    private final BillRepository billRepository;

    public BillNotificationService(BillRepository billRepository) {
        this.billRepository = billRepository;
    }

    /**
     * GENERATE BILL MESSAGE
     */
    public String generateBillMessage(Long billId, Long retailerId) {

        Bill bill = billRepository.findById(billId)
                .orElseThrow(() ->
                        new RuntimeException("Bill not found"));

        if (!bill.getRetailer().getId().equals(retailerId)) {
            throw new RuntimeException("Unauthorized access");
        }

        return """
        Khatha Book

        Bill No   : %s
        Date      : %s

        Items:
        %s

        Total     : ₹ %.2f
        Paid      : ₹ %.2f
        Due       : ₹ %.2f

        Thank you 🙏
        Visit again
        """.formatted(
                bill.getBillNumber(),
                bill.getBillDate(),
                bill.getItems(),
                bill.getAmount(),
                bill.getPaidAmount(),
                bill.getDueAmount()
        );
    }
}
