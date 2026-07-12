package com.transactx.api.service;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.transactx.api.domain.AuditLog;
import com.transactx.api.domain.User;
import com.transactx.api.repository.AuditLogRepository;
import com.transactx.api.repository.AuditLogSpecification;
import com.transactx.api.repository.UserRepository;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AuditServiceImpl implements AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditServiceImpl.class);

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditServiceImpl(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public void log(UUID userId, String action, String ipAddress, String device, 
                    Map<String, Object> oldValues, Map<String, Object> newValues, String transactionRef) {
        
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        AuditLog auditLog = AuditLog.builder()
                .user(user)
                .action(action)
                .ipAddress(ipAddress != null ? ipAddress : "0.0.0.0")
                .device(device != null ? device : "UNKNOWN")
                .oldValues(oldValues)
                .newValues(newValues)
                .transactionRef(transactionRef)
                .build();

        auditLogRepository.save(auditLog);
        log.info("Audit Log Created: Action={}, User={}", action, user != null ? user.getUsername() : "ANONYMOUS");
    }

    @Override
    public Page<AuditLog> getLogs(String search, String action, String username, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<AuditLog> spec = Specification.where(AuditLogSpecification.hasSearch(search))
                .and(AuditLogSpecification.hasAction(action))
                .and(AuditLogSpecification.hasUsername(username));

        return auditLogRepository.findAll(spec, pageable);
    }

    @Override
    public ByteArrayInputStream exportCSV(String search, String action, String username) {
        Specification<AuditLog> spec = Specification.where(AuditLogSpecification.hasSearch(search))
                .and(AuditLogSpecification.hasAction(action))
                .and(AuditLogSpecification.hasUsername(username));

        List<AuditLog> logs = auditLogRepository.findAll(spec, Sort.by("createdAt").descending());

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(out)) {
            // Write headers
            writer.println("Log ID,User,Action,IP Address,Device,Transaction Ref,Timestamp");

            for (AuditLog audit : logs) {
                writer.printf("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                        audit.getId(),
                        audit.getUser() != null ? audit.getUser().getUsername() : "ANONYMOUS",
                        audit.getAction(),
                        audit.getIpAddress(),
                        audit.getDevice(),
                        audit.getTransactionRef() != null ? audit.getTransactionRef() : "",
                        audit.getCreatedAt()
                );
            }
            writer.flush();
        } catch (Exception e) {
            log.error("Failed to generate CSV export", e);
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    @Override
    public ByteArrayInputStream exportExcel(String search, String action, String username) {
        Specification<AuditLog> spec = Specification.where(AuditLogSpecification.hasSearch(search))
                .and(AuditLogSpecification.hasAction(action))
                .and(AuditLogSpecification.hasUsername(username));

        List<AuditLog> logs = auditLogRepository.findAll(spec, Sort.by("createdAt").descending());

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Audit Logs");

            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] columns = {"Log ID", "User", "Action", "IP Address", "Device", "Transaction Ref", "Timestamp"};
            for (int i = 0; i < columns.length; i++) {
                headerRow.createCell(i).setCellValue(columns[i]);
            }

            int rowIdx = 1;
            for (AuditLog audit : logs) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(audit.getId().toString());
                row.createCell(1).setCellValue(audit.getUser() != null ? audit.getUser().getUsername() : "ANONYMOUS");
                row.createCell(2).setCellValue(audit.getAction());
                row.createCell(3).setCellValue(audit.getIpAddress());
                row.createCell(4).setCellValue(audit.getDevice());
                row.createCell(5).setCellValue(audit.getTransactionRef() != null ? audit.getTransactionRef() : "");
                row.createCell(6).setCellValue(audit.getCreatedAt().toString());
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (Exception e) {
            log.error("Failed to generate Excel export", e);
            return new ByteArrayInputStream(new byte[0]);
        }
    }

    @Override
    public ByteArrayInputStream exportPDF(String search, String action, String username) {
        Specification<AuditLog> spec = Specification.where(AuditLogSpecification.hasSearch(search))
                .and(AuditLogSpecification.hasAction(action))
                .and(AuditLogSpecification.hasUsername(username));

        List<AuditLog> logs = auditLogRepository.findAll(spec, Sort.by("createdAt").descending());

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate()); // Landscape is better for reports
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD);
            Paragraph title = new Paragraph("Enterprise Banking Engine - Audit Log Report", titleFont);
            title.setAlignment(Paragraph.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Table with 7 columns
            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{3.0f, 1.5f, 2.0f, 1.5f, 2.0f, 2.0f, 2.0f});

            // Headers
            Font headFont = new Font(Font.HELVETICA, 10, Font.BOLD);
            String[] headers = {"Log ID", "User", "Action", "IP Address", "Device", "Tx Ref", "Timestamp"};
            for (String header : headers) {
                table.addCell(new Paragraph(header, headFont));
            }

            Font dataFont = new Font(Font.HELVETICA, 8);
            for (AuditLog audit : logs) {
                table.addCell(new Paragraph(audit.getId().toString(), dataFont));
                table.addCell(new Paragraph(audit.getUser() != null ? audit.getUser().getUsername() : "ANONYMOUS", dataFont));
                table.addCell(new Paragraph(audit.getAction(), dataFont));
                table.addCell(new Paragraph(audit.getIpAddress(), dataFont));
                table.addCell(new Paragraph(audit.getDevice(), dataFont));
                table.addCell(new Paragraph(audit.getTransactionRef() != null ? audit.getTransactionRef() : "", dataFont));
                table.addCell(new Paragraph(audit.getCreatedAt().toString(), dataFont));
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            log.error("Failed to generate PDF export", e);
        }

        return new ByteArrayInputStream(out.toByteArray());
    }
}
