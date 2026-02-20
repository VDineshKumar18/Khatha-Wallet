package com.khathabook.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import com.khathabook.model.Customer;
import com.khathabook.model.Retailer;
import com.khathabook.repository.BillRepository;
import com.khathabook.repository.CustomerRepository;
import com.khathabook.repository.RetailerRepository;

class CustomerServiceTest {

    private CustomerService customerService;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private BillRepository billRepository;

    @Mock
    private RetailerRepository retailerRepository;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        customerService = new CustomerService(customerRepository, billRepository, retailerRepository);
    }

    @Test
    void deleteCustomer_ShouldFail_WhenBillsExist() {
        // Arrange
        Long customerId = 101L;
        Long retailerId = 1L;
        
        Customer customer = new Customer();
        customer.setId(customerId);
        Retailer retailer = new Retailer();
        retailer.setId(retailerId);
        customer.setRetailer(retailer);

        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(billRepository.countByCustomerIdAndRetailerId(customerId, retailerId)).thenReturn(5L);

        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            customerService.deleteCustomer(customerId, retailerId);
        });

        assertEquals("Cannot delete customer. Bills exist.", exception.getMessage());
        verify(customerRepository, never()).delete(any());
    }

    @Test
    void deleteCustomer_ShouldSucceed_WhenNoBillsExist() {
        // Arrange
        Long customerId = 102L;
        Long retailerId = 1L;
        
        Customer customer = new Customer();
        customer.setId(customerId);
        Retailer retailer = new Retailer();
        retailer.setId(retailerId);
        customer.setRetailer(retailer);

        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(billRepository.countByCustomerIdAndRetailerId(customerId, retailerId)).thenReturn(0L);

        // Act
        customerService.deleteCustomer(customerId, retailerId);

        // Assert
        verify(customerRepository, times(1)).delete(customer);
    }

    @Test
    void deleteCustomer_ShouldFail_WhenUnauthorized() {
        // Arrange
        Long customerId = 103L;
        Long retailerId = 1L;
        Long otherRetailerId = 2L;
        
        Customer customer = new Customer();
        customer.setId(customerId);
        Retailer otherRetailer = new Retailer();
        otherRetailer.setId(otherRetailerId);
        customer.setRetailer(otherRetailer);

        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));

        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            customerService.deleteCustomer(customerId, retailerId);
        });

        assertEquals("Unauthorized delete", exception.getMessage());
    }
}
