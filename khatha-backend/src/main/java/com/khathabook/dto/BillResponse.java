package com.khathabook.dto;

import java.time.LocalDate;

public class BillResponse {

    private Long id;
    private String type;
    private double amount;
    private String items;
    private LocalDate billDate;

    public BillResponse(
            Long id,
            String type,
            double amount,
            String items,
            LocalDate billDate
    ) {
        this.id = id;
        this.type = type;
        this.amount = amount;
        this.items = items;
        this.billDate = billDate;
    }

    public Long getId() { return id; }
    public String getType() { return type; }
    public double getAmount() { return amount; }
    public String getItems() { return items; }
    public LocalDate getBillDate() { return billDate; }
}
