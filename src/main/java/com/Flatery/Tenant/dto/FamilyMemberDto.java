package com.Flatery.Tenant.dto;

import lombok.Data;

/**
 * Represents each family or occupant member detail.
 */
@Data
public class FamilyMemberDto {
    private String name;
    private String relation;
    private Integer age;
}
