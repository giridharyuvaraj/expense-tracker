package com.expensetracker.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class UpdateProfileRequest {
    private String name;
    private BigDecimal salary;
}