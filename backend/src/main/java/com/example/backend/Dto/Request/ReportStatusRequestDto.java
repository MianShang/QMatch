package com.example.backend.Dto.Request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ReportStatusRequestDto {
    private Long reportId; //정지 상태인지 아닌지
}