package com.khathabook.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private double amount;
    private LocalDate paymentDate;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    // ✅ NEW (SAFE)
    @ManyToOne
    @JoinColumn(name = "bill_id")
    private Bill bill;

    public Payment() {}

    public Long getId() { return id; }
    public double getAmount() { return amount; }
    public LocalDate getPaymentDate() { return paymentDate; }
    public Customer getCustomer() { return customer; }
    public Bill getBill() { return bill; }

    public void setId(Long id) { this.id = id; }
    public void setAmount(double amount) { this.amount = amount; }
    public void setPaymentDate(LocalDate paymentDate) { this.paymentDate = paymentDate; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public void setBill(Bill bill) { this.bill = bill; }
}
