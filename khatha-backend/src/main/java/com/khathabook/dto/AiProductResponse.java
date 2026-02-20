package com.khathabook.dto;

public class AiProductResponse {

    private Long productId;
    private String name;
    private String barcode;
    private double price;
    private double confidence;
    private String ocrText; // 📖 NEW FIELD

    public AiProductResponse(
            Long productId,
            String name,
            String barcode,
            double price,
            double confidence,
            String ocrText
    ) {
        this.productId = productId;
        this.name = name;
        this.barcode = barcode;
        this.price = price;
        this.confidence = confidence;
        this.ocrText = ocrText;
    }

    public AiProductResponse(Long productId, String name, String barcode, double price, double confidence) {
        this(productId, name, barcode, price, confidence, null);
    }

    public Long getProductId() { return productId; }
    public String getName() { return name; }
    public String getBarcode() { return barcode; }
    public double getPrice() { return price; }
    public double getConfidence() { return confidence; }
    public String getOcrText() { return ocrText; }
}
