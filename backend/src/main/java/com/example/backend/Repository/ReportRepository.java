package com.example.backend.Repository;

import com.example.backend.Entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {


    List<Report> findAllByOrderByIdDesc();
}