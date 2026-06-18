package com.company.farmdigitaltwin.controller;

import com.company.farmdigitaltwin.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/reports")
@Tag(name = "Reports", description = "Endpoints for Exporting Farm Reports")
@Slf4j
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/export/excel")
    @Operation(summary = "Export farm assets inventory into a multi-sheet Excel spreadsheet")
    public void exportToExcel(HttpServletResponse response) throws IOException {
        log.info("Request received to export farm assets report to Excel");
        
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=farm_digital_twin_report.xlsx");
        
        reportService.generateExcelReport(response.getOutputStream());
        
        log.info("Excel report generated successfully");
    }

    @GetMapping("/export/pdf")
    @Operation(summary = "Export a summary audit report of the farm assets into a PDF")
    public void exportToPdf(HttpServletResponse response) throws IOException {
        log.info("Request received to export farm assets report to PDF");
        
        response.setContentType("application/pdf");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=farm_digital_twin_summary.pdf");
        
        reportService.generatePdfReport(response.getOutputStream());
        
        log.info("PDF report generated successfully");
    }
}
