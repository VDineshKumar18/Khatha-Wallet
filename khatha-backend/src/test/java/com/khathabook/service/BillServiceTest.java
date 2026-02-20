package com.khathabook.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import com.khathabook.model.Product;
import com.khathabook.repository.BillRepository;
import com.khathabook.repository.CustomerRepository;
import com.khathabook.repository.ProductRepository;
import com.khathabook.repository.RetailerRepository;
import com.khathabook.service.NotificationService;

class BillServiceTest {

    private BillService billService;

    @Mock
    private BillRepository billRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private RetailerRepository retailerRepository;

    @Mock
    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        billService = new BillService(billRepository, customerRepository, productRepository, retailerRepository, notificationService);
    }

    @Test
    void reduceStockFromBill_ShouldReduceStock_WhenDataIsCorrect() {
        // Arrange
        Long retailerId = 1L;
        String items = "BAR001 x2.5, BAR002 x1";
        
        Product p1 = new Product();
        p1.setId(1L);
        p1.setBarcode("BAR001");
        p1.setProductType("WEIGHT");
        p1.setQuantity(10.0);
        p1.setName("Rice");

        Product p2 = new Product();
        p2.setId(2L);
        p2.setBarcode("BAR002");
        p2.setProductType("UNIT");
        p2.setQuantity(5.0);
        p2.setName("Soap");

        when(productRepository.findByBarcodeAndRetailer_Id("BAR001", retailerId)).thenReturn(Optional.of(p1));
        when(productRepository.findByBarcodeAndRetailer_Id("BAR002", retailerId)).thenReturn(Optional.of(p2));

        // Act
        billService.reduceStockFromBill(items, retailerId);

        // Assert
        assertEquals(7.5, p1.getQuantity());
        assertEquals(4.0, p2.getQuantity());
        verify(productRepository, times(1)).save(p1);
        verify(productRepository, times(1)).save(p2);
    }

    @Test
    void reduceStockFromBill_ShouldThrowException_WhenStockIsInsufficient() {
        // Arrange
        Long retailerId = 1L;
        String items = "BAR001 x11";
        
        Product p1 = new Product();
        p1.setId(1L);
        p1.setBarcode("BAR001");
        p1.setProductType("UNIT");
        p1.setQuantity(10.0);
        p1.setName("Rice Bag");

        when(productRepository.findByBarcodeAndRetailer_Id("BAR001", retailerId)).thenReturn(Optional.of(p1));

        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            billService.reduceStockFromBill(items, retailerId);
        });

        assertTrue(exception.getMessage().contains("Insufficient stock"));
    }

    @Test
    void reduceStockFromBill_ShouldThrowException_WhenProductNotFound() {
        // Arrange
        Long retailerId = 1L;
        String items = "UNKNOWN x1";
        
        when(productRepository.findByBarcodeAndRetailer_Id("UNKNOWN", retailerId)).thenReturn(Optional.empty());
        when(productRepository.findAllByBarcodeAndRetailer_Id("UNKNOWN", retailerId)).thenReturn(Collections.emptyList());

        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            billService.reduceStockFromBill(items, retailerId);
        });

        assertTrue(exception.getMessage().contains("Product not found"));
    }
}
