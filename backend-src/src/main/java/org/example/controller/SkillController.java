package org.example.controller;


import lombok.RequiredArgsConstructor;
import org.example.dto.SkillDto;
import org.example.entity.Skill;
import org.example.mapper.SkillMapper;
import org.example.service.SkillService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.Set;


@RestController
@RequestMapping("/api/v1/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;

    @PostMapping("/add")
    public ResponseEntity<SkillDto> addSkill(@AuthenticationPrincipal Jwt jwt, @RequestBody SkillDto dto) {
        Long userId = jwt.getClaim("userId");
        Skill skill = skillService.addSkill(userId, dto.getName());

        if (skill == null) return ResponseEntity.status(409).build();
        return ResponseEntity.ok(SkillMapper.toDto(skill));
    }

    @DeleteMapping("/remove/{skillId}")
    public ResponseEntity<Void> removeSkill(@AuthenticationPrincipal Jwt jwt, @PathVariable Long skillId) {
        Long userId = jwt.getClaim("userId");
        boolean removed = skillService.removeSkill(userId, skillId);
        if (!removed) return ResponseEntity.notFound().build();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{userId}")
    public ResponseEntity<Set<SkillDto>> getSkills(@PathVariable Long userId) {
        Set<SkillDto> dtos = skillService.getSkills(userId);

        return ResponseEntity.ok(dtos);
    }
}
