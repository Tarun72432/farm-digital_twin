package com.company.farmdigitaltwin.service;

import com.company.farmdigitaltwin.entity.*;
import com.company.farmdigitaltwin.repository.*;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.OutputStream;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ReportService {

    private final FarmRepository farmRepository;
    private final TreeRepository treeRepository;
    private final PipelineRepository pipelineRepository;
    private final ValveRepository valveRepository;
    private final PumpRepository pumpRepository;
    private final TankRepository tankRepository;

    private static final DateTimeFormatter DATE_FORMATTER = 
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.systemDefault());

    public ReportService(FarmRepository farmRepository,
                         TreeRepository treeRepository,
                         PipelineRepository pipelineRepository,
                         ValveRepository valveRepository,
                         PumpRepository pumpRepository,
                         TankRepository tankRepository) {
        this.farmRepository = farmRepository;
        this.treeRepository = treeRepository;
        this.pipelineRepository = pipelineRepository;
        this.valveRepository = valveRepository;
        this.pumpRepository = pumpRepository;
        this.tankRepository = tankRepository;
    }

    @Transactional(readOnly = true)
    public void generateExcelReport(OutputStream out) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            
            // 1. Farms Sheet
            Sheet farmSheet = workbook.createSheet("Farms");
            Row farmHeader = farmSheet.createRow(0);
            String[] farmHeaders = {"ID", "Name", "Owner", "Area (ha)", "Status", "Registered Date"};
            for (int i = 0; i < farmHeaders.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = farmHeader.createCell(i);
                cell.setCellValue(farmHeaders[i]);
                setBoldStyle(workbook, cell);
            }
            List<Farm> farms = farmRepository.findAll();
            int rowIdx = 1;
            for (Farm farm : farms) {
                Row row = farmSheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(farm.getId());
                row.createCell(1).setCellValue(farm.getName());
                row.createCell(2).setCellValue(farm.getOwnerName());
                row.createCell(3).setCellValue(farm.getArea() != null ? farm.getArea() : 0.0);
                row.createCell(4).setCellValue(farm.getStatus());
                row.createCell(5).setCellValue(DATE_FORMATTER.format(farm.getCreatedAt()));
            }

            // 2. Trees Sheet
            Sheet treeSheet = workbook.createSheet("Trees");
            Row treeHeader = treeSheet.createRow(0);
            String[] treeHeaders = {"ID", "Farm Name", "Tree Number", "Species", "Age (months)", "Health Status", "Coordinates"};
            for (int i = 0; i < treeHeaders.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = treeHeader.createCell(i);
                cell.setCellValue(treeHeaders[i]);
                setBoldStyle(workbook, cell);
            }
            List<Tree> trees = treeRepository.findAll();
            rowIdx = 1;
            for (Tree tree : trees) {
                Row row = treeSheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(tree.getId());
                row.createCell(1).setCellValue(tree.getFarm().getName());
                row.createCell(2).setCellValue(tree.getTreeNumber());
                row.createCell(3).setCellValue(tree.getSpecies());
                row.createCell(4).setCellValue(tree.getAge() != null ? tree.getAge() : 0);
                row.createCell(5).setCellValue(tree.getHealthStatus());
                row.createCell(6).setCellValue(String.format("Lng: %.6f, Lat: %.6f", tree.getLocation().getX(), tree.getLocation().getY()));
            }

            // 3. Pipelines Sheet
            Sheet pipeSheet = workbook.createSheet("Pipelines");
            Row pipeHeader = pipeSheet.createRow(0);
            String[] pipeHeaders = {"ID", "Farm Name", "Name", "Diameter (mm)", "Material", "Length (m)", "Status"};
            for (int i = 0; i < pipeHeaders.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = pipeHeader.createCell(i);
                cell.setCellValue(pipeHeaders[i]);
                setBoldStyle(workbook, cell);
            }
            List<Pipeline> pipelines = pipelineRepository.findAll();
            rowIdx = 1;
            for (Pipeline pipe : pipelines) {
                Row row = pipeSheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(pipe.getId());
                row.createCell(1).setCellValue(pipe.getFarm().getName());
                row.createCell(2).setCellValue(pipe.getName());
                row.createCell(3).setCellValue(pipe.getDiameter() != null ? pipe.getDiameter() : 0.0);
                row.createCell(4).setCellValue(pipe.getMaterial());
                row.createCell(5).setCellValue(pipe.getLength() != null ? pipe.getLength() : 0.0);
                row.createCell(6).setCellValue(pipe.getStatus());
            }

            // Auto-size columns
            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                Sheet sheet = workbook.getSheetAt(i);
                if (sheet.getPhysicalNumberOfRows() > 0) {
                    Row firstRow = sheet.getRow(0);
                    for (int c = 0; c < firstRow.getPhysicalNumberOfCells(); c++) {
                        sheet.autoSizeColumn(c);
                    }
                }
            }

            workbook.write(out);
        }
    }

    @Transactional(readOnly = true)
    public void generatePdfReport(OutputStream out) {
        Document document = new Document(PageSize.A4);
        PdfWriter.getInstance(document, out);
        document.open();

        // Styles
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, Font.BOLD);
        Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Font.BOLD);
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.BOLD);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Font.NORMAL);

        // Header
        Paragraph title = new Paragraph("Farm Digital Twin Summary Report", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);
        
        Paragraph datePar = new Paragraph("Generated on: " + DATE_FORMATTER.format(java.time.Instant.now()), normalFont);
        datePar.setAlignment(Element.ALIGN_CENTER);
        document.add(datePar);
        document.add(new Paragraph(" ")); // Spacer

        // 1. General Metrics
        document.add(new Paragraph("1. Farm Overview Metrics", sectionFont));
        document.add(new Paragraph(" "));

        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        
        table.addCell(new PdfPCell(new Paragraph("Total Registered Farms", labelFont)));
        table.addCell(new PdfPCell(new Paragraph(String.valueOf(farmRepository.count()), normalFont)));
        
        table.addCell(new PdfPCell(new Paragraph("Total Mapped Trees", labelFont)));
        table.addCell(new PdfPCell(new Paragraph(String.valueOf(treeRepository.count()), normalFont)));

        table.addCell(new PdfPCell(new Paragraph("Total Pipelines", labelFont)));
        table.addCell(new PdfPCell(new Paragraph(String.valueOf(pipelineRepository.count()), normalFont)));

        table.addCell(new PdfPCell(new Paragraph("Total Valves", labelFont)));
        table.addCell(new PdfPCell(new Paragraph(String.valueOf(valveRepository.count()), normalFont)));

        table.addCell(new PdfPCell(new Paragraph("Total Water Pumps", labelFont)));
        table.addCell(new PdfPCell(new Paragraph(String.valueOf(pumpRepository.count()), normalFont)));

        table.addCell(new PdfPCell(new Paragraph("Total Storage Tanks", labelFont)));
        table.addCell(new PdfPCell(new Paragraph(String.valueOf(tankRepository.count()), normalFont)));

        document.add(table);
        document.add(new Paragraph(" ")); // Spacer

        // 2. Farm List
        document.add(new Paragraph("2. Farms Boundary Statistics", sectionFont));
        document.add(new Paragraph(" "));

        PdfPTable farmTable = new PdfPTable(4);
        farmTable.setWidthPercentage(100);
        farmTable.addCell(new PdfPCell(new Paragraph("Farm Name", labelFont)));
        farmTable.addCell(new PdfPCell(new Paragraph("Owner", labelFont)));
        farmTable.addCell(new PdfPCell(new Paragraph("Area (ha)", labelFont)));
        farmTable.addCell(new PdfPCell(new Paragraph("Status", labelFont)));

        List<Farm> farms = farmRepository.findAll();
        for (Farm farm : farms) {
            farmTable.addCell(new PdfPCell(new Paragraph(farm.getName(), normalFont)));
            farmTable.addCell(new PdfPCell(new Paragraph(farm.getOwnerName(), normalFont)));
            farmTable.addCell(new PdfPCell(new Paragraph(String.format("%.2f ha", farm.getArea()), normalFont)));
            farmTable.addCell(new PdfPCell(new Paragraph(farm.getStatus(), normalFont)));
        }
        document.add(farmTable);

        document.close();
    }

    private void setBoldStyle(Workbook workbook, org.apache.poi.ss.usermodel.Cell cell) {
        CellStyle style = workbook.createCellStyle();
        org.apache.poi.ss.usermodel.Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        cell.setCellStyle(style);
    }
}
