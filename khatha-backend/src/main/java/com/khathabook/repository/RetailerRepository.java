package com.khathabook.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.khathabook.model.Retailer;

public interface RetailerRepository extends JpaRepository<Retailer, Long> {
    Optional<Retailer> findByEmail(String email);

    @org.springframework.data.jpa.repository.Query(value = "SELECT *, " +
            "(6371 * acos(cos(radians(:lat)) * cos(radians(latitude)) * cos(radians(longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(latitude)))) AS distance " +
            "FROM retailers " +
            "HAVING distance < :radius " +
            "ORDER BY distance ASC " +
            "LIMIT :limit", nativeQuery = true)
    java.util.List<Retailer> findNearestRetailers(double lat, double lng, int radius, int limit);
}
