package com.khathabook.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.khathabook.model.Bill;
import com.khathabook.model.Customer;
import com.khathabook.model.Payment;
import com.khathabook.repository.BillRepository;
import com.khathabook.repository.CustomerRepository;
import com.khathabook.repository.PaymentRepository;

@Service
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepo;
    private final CustomerRepository customerRepo;
    private final BillRepository billRepo;

    public PaymentService(PaymentRepository paymentRepo,
                          CustomerRepository customerRepo,
                          BillRepository billRepo) {
        this.paymentRepo = paymentRepo;
        this.customerRepo = customerRepo;
        this.billRepo = billRepo;
    }

    // ✅ CREATE PAYMENT (PARTIAL / FULL)
    public Payment makePayment(Long customerId, Long billId, Payment payment) {

        Customer customer = customerRepo.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Bill bill = billRepo.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        // update bill
        bill.setPaidAmount(bill.getPaidAmount() + payment.getAmount());
        bill.setDueAmount(bill.getAmount() - bill.getPaidAmount());

        if (bill.getDueAmount() <= 0) {
            bill.setStatus("PAID");
            bill.setPaid(true);
            bill.setDueAmount(0);
        } else {
            bill.setStatus("PARTIAL");
            bill.setPaid(false);
        }

        // reduce customer due
        customer.setDueAmount(customer.getDueAmount() - payment.getAmount());

        payment.setCustomer(customer);
        payment.setBill(bill);
        payment.setPaymentDate(LocalDate.now());

        customerRepo.save(customer);
        billRepo.save(bill);
        return paymentRepo.save(payment);
    }

    public List<Payment> getAllPayments() {
        return paymentRepo.findAll();
    }

    public List<Payment> getPaymentsByCustomer(Long customerId) {
        return paymentRepo.findByCustomerId(customerId);
    }
}
