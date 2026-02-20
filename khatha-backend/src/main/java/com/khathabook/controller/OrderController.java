package com.khathabook.controller;

import com.khathabook.dto.OrderDTO;
import com.khathabook.model.Customer;
import com.khathabook.model.Order;
import com.khathabook.model.Retailer;
import com.khathabook.repository.CustomerRepository;
import com.khathabook.repository.OrderRepository;
import com.khathabook.repository.RetailerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private RetailerRepository retailerRepository;

    @Autowired
    private com.khathabook.repository.BillRepository billRepository;

    @Autowired
    private com.khathabook.service.NotificationService notificationService; // ✅ Inject NotificationService

    @Autowired
    private com.khathabook.service.BillService billService; // ✅ Inject BillService for stock reduction

    @PostMapping("/create")
    public ResponseEntity<?> createOrder(@RequestBody OrderDTO orderDTO) {
        Customer customer = customerRepository.findById(orderDTO.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        
        Retailer retailer = retailerRepository.findById(orderDTO.getRetailerId())
                .orElseThrow(() -> new RuntimeException("Retailer not found"));

        Order order = new Order();
        order.setCustomer(customer);
        order.setRetailer(retailer);
        order.setItems(orderDTO.getItems());
        order.setTotalAmount(orderDTO.getTotalAmount());
        order.setPaymentMode(orderDTO.getPaymentMode()); // ✅ SET PAYMENT MODE
        order.setStatus("PENDING");

        // ✅ IMMEDIATE STOCK REDUCTION
        try {
            // Convert JSON items to "Barcode x Qty, Barcode x Qty" format
            String itemsJson = orderDTO.getItems();
            String formattedItems = "";
            
            if (itemsJson != null && !itemsJson.isEmpty()) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.JsonNode rootNode = mapper.readTree(itemsJson);
                
                StringBuilder sb = new StringBuilder();
                if (rootNode.isArray()) {
                    for (com.fasterxml.jackson.databind.JsonNode node : rootNode) {
                         // ✅ Extract Barcode and Quantity
                        String barcode = node.has("barcode") ? node.get("barcode").asText() : "";
                        double qty = node.has("qty") ? node.get("qty").asDouble() : 0;
                        
                        if (!barcode.isEmpty() && qty > 0) {
                            if (sb.length() > 0) sb.append(", ");
                            sb.append(barcode).append(" x ").append(qty);
                        }
                    }
                }
                formattedItems = sb.toString();
            }

            // ✅ Call Reduce Stock with Formatted String
            if (!formattedItems.isEmpty()) {
                 billService.reduceStockFromBill(formattedItems, retailer.getId());
            }
            
        } catch (Exception e) {
             System.err.println("Stock Reduction Failed: " + e.getMessage());
             return ResponseEntity.badRequest().body("Order failed: " + e.getMessage());
        }

        orderRepository.save(order);

        // ✅ Notify Retailer
        notificationService.sendNewOrderEmail(order, retailer);

        return ResponseEntity.ok("Order placed successfully");
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<OrderDTO>> getOrdersByCustomer(@PathVariable Long customerId) {
        List<Order> orders = orderRepository.findByCustomerIdOrderByOrderDateDesc(customerId);
        return ResponseEntity.ok(orders.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    @GetMapping("/retailer/{retailerId}")
    public ResponseEntity<List<OrderDTO>> getOrdersByRetailer(@PathVariable Long retailerId) {
        List<Order> orders = orderRepository.findByRetailerIdOrderByOrderDateDesc(retailerId);
        return ResponseEntity.ok(orders.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long orderId, 
            @RequestParam String status,
            @RequestParam(required = false) String otp // ✅ OTP for Delivery
    ) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        String oldStatus = order.getStatus();

        // ✅ 0. STATUS TRANSITION VALIDATION
        if ("CANCELLED".equalsIgnoreCase(status) && !"PENDING".equalsIgnoreCase(oldStatus)) {
            return ResponseEntity.badRequest().body("Only PENDING orders can be cancelled");
        }
        if ("PACKED".equalsIgnoreCase(status) && !"PENDING".equalsIgnoreCase(oldStatus)) {
            return ResponseEntity.badRequest().body("Only PENDING orders can be marked as PACKED");
        }
        if ("PENDING".equalsIgnoreCase(status) && !"PENDING".equalsIgnoreCase(oldStatus)) {
            return ResponseEntity.badRequest().body("Cannot move back to PENDING status");
        }

        // ✅ 1. GENERATE OTP ON "PACKED"
        if ("PACKED".equalsIgnoreCase(status) && !"PACKED".equalsIgnoreCase(oldStatus)) {
            String generatedOtp = String.format("%06d", new java.util.Random().nextInt(999999));
            order.setDeliveryOtp(generatedOtp);
        }

        // ✅ 2. VERIFY OTP ON "DELIVERED"
        if ("DELIVERED".equalsIgnoreCase(status) && !"DELIVERED".equalsIgnoreCase(oldStatus)) {
            if (order.getDeliveryOtp() != null && !order.getDeliveryOtp().equals(otp)) {
                return ResponseEntity.badRequest().body("Invalid Delivery OTP");
            }
        }

        order.setStatus(status);
        orderRepository.save(order);

        // ✅ AUTO-GENERATE BILL ON DELIVERY
        if ("DELIVERED".equalsIgnoreCase(status) && !"DELIVERED".equalsIgnoreCase(oldStatus)) {
            com.khathabook.model.Bill bill = new com.khathabook.model.Bill();
            bill.setRetailer(order.getRetailer());
            bill.setCustomer(order.getCustomer());
            bill.setBillDate(java.time.LocalDate.now());
            bill.setItems(order.getItems());
            bill.setAmount(order.getTotalAmount());
            bill.setBillNumber("ORD-" + order.getId());
            bill.setType("SALE");
            bill.setPaymentMode(order.getPaymentMode());

            // ⚠️ STOCK ALREADY REDUCED AT ORDER CREATION
            // We do NOT reduce it again here.
            
            // Handle Payment Status
            if ("KHATHA".equalsIgnoreCase(order.getPaymentMode())) {
                bill.setStatus("DUE"); // Unpaid
                bill.setPaid(false);
                bill.setPaidAmount(0);
                bill.setDueAmount(order.getTotalAmount());

                // Update Customer Ledger
                Customer customer = order.getCustomer();
                customer.setDueAmount(customer.getDueAmount() + order.getTotalAmount());
                customerRepository.save(customer);

            } else {
                // Online or Cash (Paid)
                bill.setStatus("PAID");
                bill.setPaid(true);
                bill.setPaidAmount(order.getTotalAmount());
                bill.setDueAmount(0);
                
                // Track total received
                 Customer customer = order.getCustomer();
                 customer.setTotalReceived(customer.getTotalReceived() + order.getTotalAmount());
                 customerRepository.save(customer);
            }

            billRepository.save(bill);
        }

        // ✅ Notify Customer if status changes
        if (!status.equals(oldStatus)) {
            // ✅ RESTORE STOCK ON CANCEL
            if ("CANCELLED".equalsIgnoreCase(status) && !"CANCELLED".equalsIgnoreCase(oldStatus)) {
                billService.restoreStock(order.getItems(), order.getRetailer().getId());
            }

            notificationService.sendOrderStatusEmail(order, order.getCustomer());
        }

        return ResponseEntity.ok("Status updated");
    }

    private OrderDTO convertToDTO(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setCustomerId(order.getCustomer().getId());
        dto.setCustomerName(order.getCustomer().getName()); // ✅ POPULATE
        dto.setCustomerPhone(order.getCustomer().getPhone()); // ✅ POPULATE
        dto.setRetailerId(order.getRetailer().getId());
        dto.setRetailerName(order.getRetailer().getName()); // ✅ POPULATE NAME
        dto.setItems(order.getItems());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setPaymentMode(order.getPaymentMode()); // ✅ INCLUDE IN DTO
        dto.setStatus(order.getStatus());
        dto.setOrderDate(order.getOrderDate().toString());
        return dto;
    }
}
