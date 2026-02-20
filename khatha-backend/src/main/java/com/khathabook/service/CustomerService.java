package com.khathabook.service;

import org.springframework.stereotype.Service;
import java.util.List;

import com.khathabook.model.Customer;
import com.khathabook.model.Retailer;
import com.khathabook.repository.CustomerRepository;
import com.khathabook.repository.BillRepository;
import com.khathabook.repository.RetailerRepository;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final BillRepository billRepository;
    private final RetailerRepository retailerRepository;

    public CustomerService(
            CustomerRepository customerRepository,
            BillRepository billRepository,
            RetailerRepository retailerRepository
    ) {
        this.customerRepository = customerRepository;
        this.billRepository = billRepository;
        this.retailerRepository = retailerRepository;
    }

    public List<Customer> getAllByRetailer(Long retailerId) {
        return customerRepository.findByRetailerId(retailerId);
    }

    public Customer save(Customer customer, Long retailerId) {
        Retailer retailer = retailerRepository.findById(retailerId)
                .orElseThrow(() -> new RuntimeException("Retailer not found"));

        // ✅ UNIQUE CHECK: One email per retailer
        customerRepository.findByEmailAndRetailerId(customer.getEmail(), retailerId)
                .ifPresent(existing -> {
                    throw new RuntimeException("Customer with this email already exists in your ledger");
                });

        customer.setRetailer(retailer);
        return customerRepository.save(customer);
    }

    public Customer save(Customer customer) {
        return customerRepository.save(customer);
    }

    public Customer getById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
    }

    // ✅ FINAL SAFE DELETE
    public void deleteCustomer(Long customerId, Long retailerId) {

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (!customer.getRetailer().getId().equals(retailerId)) {
            throw new RuntimeException("Unauthorized delete");
        }

        long billCount =
                billRepository.countByCustomerIdAndRetailerId(customerId, retailerId);

        if (billCount > 0) {
            throw new RuntimeException("Cannot delete customer. Bills exist.");
        }

        customerRepository.delete(customer);
    }
}
