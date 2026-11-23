package org.example.service;

import lombok.RequiredArgsConstructor;
import org.example.dto.SkillDto;
import org.example.dto.UserListDto;
import org.example.entity.Skill;
import org.example.entity.User;
import org.example.exception.ResourceNotFoundException;
import org.example.mapper.SkillMapper;
import org.example.mapper.UserMapper;
import org.example.repo.SkillRepository;
import org.example.repo.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SkillService {

    private final UserRepository userRepository;
    private final SkillRepository skillRepository;

    @Transactional
    public Skill addSkill(Long userId, String name) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Skill skill = skillRepository.findByName(name).orElse(null);

        if (skill == null) {
            skill = new Skill();
            skill.setName(name);
            skill = skillRepository.save(skill);

            user.getSkills().add(skill);
            userRepository.save(user);
            return skill;
        }

        if (user.getSkills().contains(skill)) return null;

        user.getSkills().add(skill);
        userRepository.save(user);

        return skill;
    }

    @Transactional
    public boolean removeSkill(Long userId, Long skillId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found"));

        if (!user.getSkills().contains(skill)) return false;
        user.getSkills().remove(skill);
        userRepository.save(user);
        return true;
    }

    @Transactional(readOnly = true)
    public Set<SkillDto> getSkills(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"))
                .getSkills().stream().map(SkillMapper::toDto).collect(Collectors.toSet());
    }

    @Transactional(readOnly = true)
    public List<UserListDto> searchUsersBySkill(Long skillId) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found"));

        if (skill.getUsers() == null) {
            return List.of();
        }
        return skill.getUsers().stream()
                .map(UserMapper::toListDto)
                .toList();
    }
}
