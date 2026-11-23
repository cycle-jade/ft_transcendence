package org.example.service;

import lombok.RequiredArgsConstructor;
import org.example.dto.CommentDto;
import org.example.entity.Comment;
import org.example.entity.Post;
import org.example.entity.User;
import org.example.entity.UserRoles;
import org.example.exception.ForbiddenActionException;
import org.example.exception.ResourceNotFoundException;
import org.example.mapper.CommentMapper;
import org.example.repo.CommentRepository;
import org.example.repo.PostRepository;
import org.example.repo.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Transactional
    public CommentDto addComment(CommentDto dto, Long userId){
        Post post = postRepository.findById(dto.getPostId())
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        if (post.getDataDeleted() != null) {
            throw new IllegalArgumentException("Post has been deleted");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Comment comment = CommentMapper.toEntity(dto);
        comment.setPost(post);
        comment.setUser(user);
        comment.setDataCreated(LocalDateTime.now());

        return CommentMapper.toDto(commentRepository.save(comment));
    }

    @Transactional(readOnly = true)
    public List<CommentDto> getCommentsByPostId(Long postId) {

        List<Comment> comments = commentRepository
                .findByPostIdAndDataDeletedIsNull(postId);

        return comments.stream().map(CommentMapper::toDto).toList();
    }

    @Transactional
    public CommentDto editComment(Long commentId, CommentDto dto, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        User requester = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!comment.getUser().getId().equals(userId) && !requester.getRole().equals(UserRoles.ADMIN)) {
            throw new ForbiddenActionException("You cannot edit another user's comment");
        }

        comment.setContent(dto.getContent());
        comment.setDataEdited(LocalDateTime.now());

        return CommentMapper.toDto(commentRepository.save(comment));
    }

    @Transactional
    public void deleteComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        User requester = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!comment.getUser().getId().equals(userId) && !requester.getRole().equals(UserRoles.ADMIN)) {
            throw new ForbiddenActionException("You cannot delete another user's comment");
        }

        comment.setDataDeleted(LocalDateTime.now());
        commentRepository.save(comment);
    }

    @Transactional(readOnly = true)
    public List<CommentDto> getCommentsByUserId(Long userId) {
        List<Comment> comments = commentRepository
                .findByUserIdAndDataDeletedIsNull(userId);

        return comments.stream().map(CommentMapper::toDto).toList();
    }
}
