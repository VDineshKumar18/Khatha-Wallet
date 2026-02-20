package com.khathabook.controller;

import java.time.LocalDate;
import java.util.Map;

import org.springframework.web.bind.annotation.*;

import com.khathabook.service.ReportService;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // =============================
    // ✅ DAILY SALES REPORT
    // =============================
    @GetMapping("/daily")
    public Map<String, Object> dailyReport(
            @RequestHeader("X-Retailer-Id") Long retailerId,
            @RequestParam(required = false) String date) {

        LocalDate reportDate =
                (date == null) ? LocalDate.now() : LocalDate.parse(date);

        return reportService.dailyReport(retailerId, reportDate);
    }

    // =============================
    // ✅ MONTHLY SALES REPORT
    // =============================
    @GetMapping("/monthly")
    public Map<String, Object> monthlyReport(
            @RequestHeader("X-Retailer-Id") Long retailerId,
            @RequestParam int month,
            @RequestParam int year) {

        return reportService.monthlyReport(retailerId, month, year);
    }
}
