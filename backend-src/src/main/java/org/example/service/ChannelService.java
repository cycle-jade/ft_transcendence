package org.example.service;

import lombok.RequiredArgsConstructor;
import org.example.dto.ChannelDto;
import org.example.dto.ChannelListDto;
import org.example.dto.UserListDto;
import org.example.entity.Channel;
import org.example.entity.Post;
import org.example.entity.User;
import org.example.entity.UserRoles;
import org.example.exception.ForbiddenActionException;
import org.example.exception.ResourceNotFoundException;
import org.example.mapper.ChannelMapper;
import org.example.mapper.UserMapper;
import org.example.repo.ChannelRepository;
import org.example.repo.PostRepository;
import org.example.repo.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChannelService {

    private final ChannelRepository channelRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;

    @Transactional
    public ChannelDto createChannel(ChannelDto dto, Long adminId) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        Channel channel = ChannelMapper.toEntity(dto, admin);
        Channel saved = channelRepository.save(channel);
        if (admin.getChannels() == null) {
            admin.setChannels(new ArrayList<>());
        }
        admin.getChannels().add(saved);
        userRepository.save(admin);

        return ChannelMapper.toDto(saved);
    }

    @Transactional(readOnly = true)
    public ChannelDto getChannel(Long channelId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found"));

        return ChannelMapper.toDto(channel);
    }

    @Transactional(readOnly = true)
    public List<ChannelListDto> getAllChannels() {
        return channelRepository.findAll().stream()
                .map(ChannelMapper::toListDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChannelListDto> getChannelsByMembers(Long userId) {
        return channelRepository.findByMembersId(userId).stream()
                .map(ChannelMapper::toListDto).toList();
    }

    @Transactional(readOnly = true)
    public List<UserListDto> getAllMembers(Long channelId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found"));

        return channel.getMembers() == null
                ? List.of()
                : channel.getMembers().stream()
                .map(UserMapper::toListDto)
                .toList();
    }

    @Transactional
    public void addMember(Long channelId, Long memberId, Long requesterId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found"));
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Requester not found"));
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!memberId.equals(requesterId)) {
            checkCanManageMembers(channel, requester);
        }

        if (member.getChannels() == null) {
            member.setChannels(new ArrayList<>());
        }
        boolean alreadyMember = member.getChannels().stream()
                .anyMatch(existingChannel -> existingChannel.getId().equals(channelId));
        if (!alreadyMember) {
            member.getChannels().add(channel);
            userRepository.save(member);
        }
    }

    @Transactional
    public void removeMember(Long channelId, Long memberId, Long requesterId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found"));
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Requester not found"));
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        checkCanManageMembers(channel, requester);

        if (member.getChannels() != null) {
            member.getChannels().removeIf(existingChannel -> existingChannel.getId().equals(channelId));
            userRepository.save(member);
        }
    }

    @Transactional
    public void deleteChannel(Long channelId, Long userId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!channel.getAdmin().getId().equals(userId) && !user.getRole().equals(UserRoles.ADMIN))
            throw new ForbiddenActionException("You cannot delete this channel");

        if (channel.getPosts() != null) {
            for (Post post : channel.getPosts()) {
                post.setDataDeleted(LocalDateTime.now());
                post.setChannel(null);
                postRepository.save(post);
            }
        }

        if (channel.getMembers() != null) {
            for (User member : new ArrayList<>(channel.getMembers())) {
                if (member.getChannels() != null) {
                    member.getChannels().removeIf(existingChannel -> existingChannel.getId().equals(channelId));
                    userRepository.save(member);
                }
            }
            channel.getMembers().clear();
        }

        channelRepository.delete(channel);
    }

    private void checkCanManageMembers(Channel channel, User requester) {
        if (!channel.getAdmin().getId().equals(requester.getId()) && !requester.getRole().equals(UserRoles.ADMIN)) {
            throw new ForbiddenActionException("You cannot manage members of this channel");
        }
    }
}
