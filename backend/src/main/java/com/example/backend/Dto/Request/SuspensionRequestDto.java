package com.example.backend.Dto.Request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SuspensionRequestDto {

    private Long reportId;
    private int days;

}
