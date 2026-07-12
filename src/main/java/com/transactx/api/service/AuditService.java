package com.transactx.api.service;

import com.transactx.api.domain.AuditLog;
import org.springframework.data.domain.Page;
import java.io.ByteArrayInputStream;
import java.util.Map;
import java.util.UUID;

public interface AuditService {
    void log(UUID userId, String action, String ipAddress, String device, 
             Map<String, Object> oldValues, Map<String, Object> newValues, String transactionRef);
             
    Page<AuditLog> getLogs(String search, String action, String username, int page, int size, String sortBy, String sortDir);
    
    ByteArrayInputStream exportCSV(String search, String action, String username);
    ByteArrayInputStream exportExcel(String search, String action, String username);
    ByteArrayInputStream exportPDF(String search, String action, String username);
}
