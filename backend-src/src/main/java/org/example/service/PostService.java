package org.example.service;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.dto.PostCreateDto;
import org.example.dto.PostDto;
import org.example.entity.Channel;
import org.example.entity.Post;
import org.example.entity.User;
import org.example.entity.UserRoles;
import org.example.exception.ForbiddenActionException;
import org.example.exception.ResourceNotFoundException;
import org.example.exception.UserNotFoundException;
import org.example.mapper.PostMapper;
import org.example.repo.ChannelRepository;
import org.example.repo.PostRepository;
import org.example.repo.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final PostMapper postMapper;
    private final ChannelRepository channelRepository;

    @Transactional
    public Long createPost(PostCreateDto postCreateDto, Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
        Post post = new Post(user, postCreateDto.getTitle(), postCreateDto.getContent());
        post.setDataCreated(LocalDateTime.now());
        if (postCreateDto.getChannelId() != null) {
            Channel channel = channelRepository.findById(postCreateDto.getChannelId())
                    .orElseThrow(() -> new ResourceNotFoundException("Channel not found"));
            post.setChannel(channel);
        }
        post = postRepository.save(post);
        return post.getId();
    }

    @Transactional
    public void deletePost(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        User requester = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!post.getUser().getId().equals(userId) && !requester.getRole().equals(UserRoles.ADMIN)) {
            throw new ForbiddenActionException("You can't delete someone else's post");
        }
        post.setDataDeleted(LocalDateTime.now());
        postRepository.save(post);
    }

    @Transactional(readOnly = true)
    public PostDto getPostById(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        if (post.getDataDeleted() != null) {
            throw new IllegalArgumentException("Post has been deleted");
        }

        return postMapper.toDto(post);
    }

    @Transactional(readOnly = true)
    public List<PostDto> getAllPosts() {
        return postRepository.findByDataDeletedIsNull().stream()
                .map(postMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<PostDto> getPostsByUser(Long userId) {
        return postRepository.findByUserIdAndDataDeletedIsNull(userId).stream()
                .map(postMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<PostDto> getPostsByChannel(Long channelId) {
        return postRepository.findByChannelIdAndDataDeletedIsNull(channelId).stream()
                .map(postMapper::toDto).toList();
    }

    @Transactional
    public PostDto updatePost(Long postId, Long userId, @Valid PostDto postDto) {
        Post post = postRepository.findById(postId).orElseThrow(()->new ResourceNotFoundException("Post not found"));
        User requester = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!post.getUser().getId().equals(userId) && requester.getRole() != UserRoles.ADMIN) {
            throw new ForbiddenActionException("You can't edit someone else's post");
        }
        post.setTitle(postDto.getTitle());
        post.setContent(postDto.getContent());
        if (postDto.getIdChannel() != null) {
            Channel channel = channelRepository.findById(postDto.getIdChannel())
                    .orElseThrow(() -> new ResourceNotFoundException("Channel not found"));
            post.setChannel(channel);
        }
        post.setDataEdited(LocalDateTime.now());

        return postMapper.toDto(post);
    }
}
