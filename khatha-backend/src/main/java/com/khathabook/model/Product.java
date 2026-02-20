package com.khathabook.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "products")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ================= BASIC =================
    @Column(nullable = false)
    private String name;

    // ✅ REQUIRED FOR BILLING
    @Column(nullable = false, unique = true)
    private String barcode;

    @Column(nullable = false)
    private double price;

    // WEIGHT | LIQUID | UNIT
    @Column(nullable = false)
    private String productType;

    // ✅ CATEGORY
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductCategory category;

    // kg / litre / pcs
    @Column(nullable = false)
    private double quantity = 0;

    // ================= BUY CONFIG =================
    private Integer bagSizeKg;        // WEIGHT
    private Integer packetsPerBox;    // LIQUID
    private Double packetSize;        // LIQUID
    private Integer unitsPerBox;      // UNIT
    // ==============================================

    private int lowStockAlert = 10;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "retailer_id", nullable = false)
    @JsonIgnoreProperties({"products"})
    private Retailer retailer;

    // ===== GETTERS =====
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getBarcode() { return barcode; }
    public double getPrice() { return price; }
    public String getProductType() { return productType; }
    public ProductCategory getCategory() { return category; }
    public double getQuantity() { return quantity; }

    public Integer getBagSizeKg() { return bagSizeKg; }
    public Integer getPacketsPerBox() { return packetsPerBox; }
    public Double getPacketSize() { return packetSize; }
    public Integer getUnitsPerBox() { return unitsPerBox; }

    public int getLowStockAlert() { return lowStockAlert; }
    public Retailer getRetailer() { return retailer; }

    // ===== SETTERS =====
    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setBarcode(String barcode) { this.barcode = barcode; }
    public void setPrice(double price) { this.price = price; }
    public void setProductType(String productType) { this.productType = productType; }
    public void setCategory(ProductCategory category) { this.category = category; }
    public void setQuantity(double quantity) { this.quantity = quantity; }

    public void setBagSizeKg(Integer bagSizeKg) { this.bagSizeKg = bagSizeKg; }
    public void setPacketsPerBox(Integer packetsPerBox) { this.packetsPerBox = packetsPerBox; }
    public void setPacketSize(Double packetSize) { this.packetSize = packetSize; }
    public void setUnitsPerBox(Integer unitsPerBox) { this.unitsPerBox = unitsPerBox; }

    public void setLowStockAlert(int lowStockAlert) { this.lowStockAlert = lowStockAlert; }
    public void setRetailer(Retailer retailer) { this.retailer = retailer; }
}
