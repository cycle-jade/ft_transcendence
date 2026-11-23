package org.example.mapper;

import org.example.dto.SkillDto;
import org.example.entity.Skill;

public class SkillMapper {
    public static SkillDto toDto(Skill skill) {
        SkillDto dto = new SkillDto();
        dto.setId(skill.getId());
        dto.setName(skill.getName());
        return dto;
    }
}
