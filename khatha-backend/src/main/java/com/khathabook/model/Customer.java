package com.khathabook.model;

import jakarta.persistence.*;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "customers", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"email", "retailer_id"})
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String phone;
    private String email;
    private double dueAmount;
    private double totalReceived = 0.0; // ✅ New Field

    // ✅ NEW (LOYALTY)
    private int loyaltyPoints = 0;


    // ✅ NEW: SCHEME MANAGEMENT
    private boolean isSchemeActive = false;
    private java.time.LocalDate schemeStartDate;
    private double schemeMonthlyAmount = 0.0;
    private double schemeCollectedAmount = 0.0;
    private double schemeTargetAmount = 0.0;
    private int schemeMonthsPaid = 0; // Track count

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "retailer_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Retailer retailer;

    @OneToMany(mappedBy = "customer", fetch = FetchType.LAZY)
    @JsonBackReference
    private java.util.List<Bill> bills;

    // ===== GETTERS =====
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }
    public double getDueAmount() { return dueAmount; }
    public double getTotalReceived() { return totalReceived; }
    public int getLoyaltyPoints() { return loyaltyPoints; }
    public boolean getIsSchemeActive() { return isSchemeActive; }
    public java.time.LocalDate getSchemeStartDate() { return schemeStartDate; }
    public double getSchemeMonthlyAmount() { return schemeMonthlyAmount; }
    public double getSchemeCollectedAmount() { return schemeCollectedAmount; }
    public double getSchemeTargetAmount() { return schemeTargetAmount; }
    public int getSchemeMonthsPaid() { return schemeMonthsPaid; }

    public Retailer getRetailer() { return retailer; }

    // ===== SETTERS =====
    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setEmail(String email) { this.email = email; }
    public void setDueAmount(double dueAmount) { this.dueAmount = dueAmount; }
    public void setTotalReceived(double totalReceived) { this.totalReceived = totalReceived; }
    public void setLoyaltyPoints(int loyaltyPoints) { this.loyaltyPoints = loyaltyPoints; }
    
    public void setIsSchemeActive(boolean isSchemeActive) { this.isSchemeActive = isSchemeActive; }
    public void setSchemeStartDate(java.time.LocalDate schemeStartDate) { this.schemeStartDate = schemeStartDate; }
    public void setSchemeMonthlyAmount(double schemeMonthlyAmount) { this.schemeMonthlyAmount = schemeMonthlyAmount; }
    public void setSchemeCollectedAmount(double schemeCollectedAmount) { this.schemeCollectedAmount = schemeCollectedAmount; }
    public void setSchemeTargetAmount(double schemeTargetAmount) { this.schemeTargetAmount = schemeTargetAmount; }
    public void setSchemeMonthsPaid(int schemeMonthsPaid) { this.schemeMonthsPaid = schemeMonthsPaid; }

    public void setRetailer(Retailer retailer) { this.retailer = retailer; }
}
