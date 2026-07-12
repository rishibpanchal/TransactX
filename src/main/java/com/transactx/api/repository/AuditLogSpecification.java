package com.transactx.api.repository;

import com.transactx.api.domain.AuditLog;
import org.springframework.data.jpa.domain.Specification;

public class AuditLogSpecification {

    public static Specification<AuditLog> hasSearch(String search) {
        return (root, query, cb) -> {
            if (search == null || search.trim().isEmpty()) return null;
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                cb.like(cb.lower(root.get("action")), pattern),
                cb.like(cb.lower(root.get("device")), pattern),
                cb.like(cb.lower(root.get("ipAddress")), pattern),
                cb.like(cb.lower(root.get("transactionRef")), pattern)
            );
        };
    }

    public static Specification<AuditLog> hasAction(String action) {
        return (root, query, cb) -> {
            if (action == null || action.trim().isEmpty()) return null;
            return cb.equal(root.get("action"), action);
        };
    }

    public static Specification<AuditLog> hasUsername(String username) {
        return (root, query, cb) -> {
            if (username == null || username.trim().isEmpty()) return null;
            return cb.equal(root.join("user", jakarta.persistence.criteria.JoinType.INNER).get("username"), username);
        };
    }
}
