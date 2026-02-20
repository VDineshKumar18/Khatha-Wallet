package com.khathabook.service;

import com.khathabook.model.Bill;
import com.khathabook.model.Customer;
import com.khathabook.model.Retailer;
import com.khathabook.repository.CustomerRepository;
import com.khathabook.repository.RetailerRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private final JavaMailSender mailSender;
    private final CustomerRepository customerRepo;
    private final RetailerRepository retailerRepo;

    public NotificationService(
            JavaMailSender mailSender,
            CustomerRepository customerRepo,
            RetailerRepository retailerRepo
    ) {
        this.mailSender = mailSender;
        this.customerRepo = customerRepo;
        this.retailerRepo = retailerRepo;
    }

    // ======================================================
    // ✅ OTP EMAIL
    // ======================================================
    public void sendOtpEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom("KhathaBook <khathabook.noreply@gmail.com>");
            helper.setTo(toEmail);
            helper.setSubject("KhathaBook Login OTP");

            helper.setText("""
                    Hello,

                    Your OTP is: %s

                    Valid for 5 minutes.

                    - KhathaBook
                    """.formatted(otp), false);

            mailSender.send(message);
            System.out.println("✅ OTP Email Sent Successfully to: " + toEmail);

        } catch (Exception e) {
            // ⚠️ FALLBACK FOR DEV/NETWORK ISSUES
            System.err.println("❌ OTP Email Failed: " + e.getMessage());
            System.out.println("⚠️ [DEV MODE] OTP for " + toEmail + " is: " + otp);
        }
    }

    // ======================================================
    // ✅ BILL EMAIL (🔥 SAFE VERSION)
    // ======================================================
    public void sendBillEmail(Bill bill, Long retailerId) {

        try {
            if (bill.getCustomer() == null) return;

            Customer customer = customerRepo.findById(bill.getCustomer().getId())
                    .orElse(null);

            if (customer == null ||
                customer.getEmail() == null ||
                customer.getEmail().isBlank()) {
                return;
            }

            Retailer retailer = retailerRepo.findById(retailerId).orElse(null);
            if (retailer == null) return;

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom("KhathaBook <khathabook.noreply@gmail.com>");
            helper.setTo(customer.getEmail());
            helper.setSubject("Bill Details from KhathaBook");

            helper.setText("""
                    Hello %s,

                    Here are your bill details:

                    🧾 Bill No: %s
                    📅 Date: %s
                    🛒 Items: %s
                    💰 Total: ₹ %.2f
                    💵 Paid: ₹ %.2f
                    ⏳ Due: ₹ %.2f
                    📌 Status: %s

                    Regards,
                    %s
                    KhathaBook
                    """.formatted(
                    customer.getName(),
                    bill.getBillNumber(),
                    bill.getBillDate(),
                    bill.getItems(),
                    bill.getAmount(),
                    bill.getPaidAmount(),
                    bill.getDueAmount(),
                    bill.getStatus(),
                    retailer.getEmail()
            ), false);

            mailSender.send(message);

        } catch (Exception e) {
            // 🔒 NEVER FAIL BILL FLOW
            System.out.println("Bill email failed: " + e.getMessage());
        }
    }

    // ======================================================
    // ✅ DUE REMINDER EMAIL
    // ======================================================
    public void sendDueAmountEmail(Long customerId, Long retailerId) {

        try {
            Customer customer = customerRepo.findById(customerId).orElse(null);
            if (customer == null ||
                customer.getEmail() == null ||
                customer.getEmail().isBlank()) {
                return;
            }

            Retailer retailer = retailerRepo.findById(retailerId).orElse(null);
            if (retailer == null) return;

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom("KhathaBook <khathabook.noreply@gmail.com>");
            helper.setTo(customer.getEmail());
            helper.setSubject("Payment Reminder – KhathaBook");

            helper.setText("""
                    Hello %s,

                    Pending Due Amount: ₹ %.2f

                    Please clear the payment at your convenience.

                    Regards,
                    %s
                    """.formatted(
                    customer.getName(),
                    customer.getDueAmount(),
                    retailer.getEmail()
            ), false);

            mailSender.send(message);

        } catch (Exception e) {
            System.out.println("Due reminder email failed: " + e.getMessage());
        }
    }

    // ======================================================
    // ✅ NEW ORDER EMAIL (To Retailer)
    // ======================================================
    public void sendNewOrderEmail(com.khathabook.model.Order order, Retailer retailer) {
        try {
            if (retailer == null || retailer.getEmail() == null) return;

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom("KhathaBook <khathabook.noreply@gmail.com>");
            helper.setTo(retailer.getEmail());
            helper.setSubject("New Order Received! 📦");

            helper.setText("""
                    New Order Alert!
                    
                    Order #%d from %s
                    Total: ₹ %.2f
                    
                    Items:
                    %s
                    
                    Please check your dashboard to process this order.
                    """.formatted(
                            order.getId(),
                            order.getCustomer().getName(),
                            order.getTotalAmount(),
                            order.getItems()
            ), false);

            mailSender.send(message);
            System.out.println("✅ New Order Email Sent to Retailer: " + retailer.getEmail());

        } catch (Exception e) {
            System.err.println("❌ New Order Email Failed: " + e.getMessage());
        }
    }

    // ======================================================
    // ✅ ORDER STATUS EMAIL (To Customer)
    // ======================================================
    public void sendOrderStatusEmail(com.khathabook.model.Order order, Customer customer) {
        try {
            if (customer == null || customer.getEmail() == null) return;

            String statusEmoji = switch (order.getStatus()) {
                case "PACKED" -> "📦";
                case "READY" -> "✅";
                case "DELIVERED" -> "🎉";
                case "COMPLETED" -> "🎉";
                default -> "ℹ️";
            };

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom("KhathaBook <khathabook.noreply@gmail.com>");
            helper.setTo(customer.getEmail());
            helper.setSubject("Order Update: " + order.getStatus() + " " + statusEmoji);

            String body = """
                    Hello %s,
                    
                    Your order #%d is now %s!
                    
                    Status: %s %s
                    
                    %s
                    
                    - KhathaBook
                    """;
            
            String extraMessage = "";
            if ("READY".equals(order.getStatus())) {
                extraMessage = "Your order is ready for pickup! Please visit the store.";
            } else if ("PACKED".equals(order.getStatus())) {
                String otp = order.getDeliveryOtp() != null ? order.getDeliveryOtp() : "N/A";
                extraMessage = "We have packed your items. \n\n🔐 **Your Delivery OTP is: " + otp + "**\n\nPlease share this OTP with the delivery agent.";
            }

            helper.setText(body.formatted(
                    customer.getName(),
                    order.getId(),
                    order.getStatus(),
                    order.getStatus(),
                    statusEmoji,
                    extraMessage
            ), false);

            mailSender.send(message);
            System.out.println("✅ Order Status Email Sent to Customer: " + customer.getEmail());

        } catch (Exception e) {
            System.err.println("❌ Order Status Email Failed: " + e.getMessage());
        }
    }
}
