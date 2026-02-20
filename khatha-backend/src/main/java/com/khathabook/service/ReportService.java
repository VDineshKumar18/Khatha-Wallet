package com.khathabook.service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.khathabook.model.Bill;
import com.khathabook.repository.BillRepository;

@Service
public class ReportService {

    private final BillRepository billRepository;

    public ReportService(BillRepository billRepository) {
        this.billRepository = billRepository;
    }

    // =============================
    // ✅ DAILY SALES REPORT
    // =============================
    public Map<String, Object> dailyReport(Long retailerId, LocalDate date) {

        List<Bill> bills =
                billRepository.findByRetailerIdAndBillDate(retailerId, date);

        double totalSales = 0;
        double cash = 0;
        double upi = 0;
        double bank = 0;
        double khatha = 0;

        for (Bill b : bills) {
            totalSales += b.getAmount();

            switch (b.getPaymentMode()) {
                case "CASH" -> cash += b.getAmount();
                case "UPI" -> upi += b.getAmount();
                case "BANK" -> bank += b.getAmount();
                case "KHATHA" -> khatha += b.getAmount();
            }
        }

        Map<String, Object> report = new HashMap<>();
        report.put("date", date);
        report.put("totalSales", totalSales);
        report.put("cash", cash);
        report.put("upi", upi);
        report.put("bank", bank);
        report.put("khatha", khatha);
        report.put("totalBills", bills.size());

        return report;
    }

    // =============================
    // ✅ MONTHLY SALES REPORT
    // =============================
    public Map<String, Object> monthlyReport(
            Long retailerId, int month, int year) {

        List<Bill> bills =
                billRepository.findMonthlyReport(retailerId, month, year);

        double totalSales = bills.stream()
                .mapToDouble(Bill::getAmount)
                .sum();

        Map<String, Object> report = new HashMap<>();
        report.put("month", month);
        report.put("year", year);
        report.put("totalSales", totalSales);
        report.put("totalBills", bills.size());

        return report;
    }
}
