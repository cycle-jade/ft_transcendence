package org.example.service;

import lombok.RequiredArgsConstructor;
import org.example.entity.Comment;
import org.example.entity.Dislike;
import org.example.entity.Post;
import org.example.entity.User;
import org.example.exception.ResourceNotFoundException;
import org.example.repo.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DislikeService {

    private final DislikeRepository dislikeRepository;
    private final LikeRepository likeRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    // POST
    @Transactional
    public void dislikePost(Long postId, Long userId) {
        if (dislikeRepository.existsByPostIdAndUserId(postId, userId)) return;
        if (likeRepository.existsByPostIdAndUserId(postId, userId)) {
            likeRepository.deleteByPostIdAndUserId(postId, userId);
        }
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Dislike dislike = new Dislike();
        dislike.setPost(post);
        dislike.setUser(user);

        dislikeRepository.save(dislike);
    }
    @Transactional
    public void removeDislikeFromPost(Long postId, Long userId) {
        dislikeRepository.deleteByPostIdAndUserId(postId, userId);
    }
    public Long getPostDislikeCount(Long postId) {
        return dislikeRepository.countByPostId(postId);
    }

    // COMMENT
    @Transactional
    public void dislikeComment(Long commentId, Long userId) {
        if (dislikeRepository.existsByCommentIdAndUserId(commentId, userId)) return;
        if (likeRepository.existsByCommentIdAndUserId(commentId, userId)) {
            likeRepository.deleteByCommentIdAndUserId(commentId, userId);
        }
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Dislike dislike = new Dislike();
        dislike.setComment(comment);
        dislike.setUser(user);

        dislikeRepository.save(dislike);
    }

    @Transactional
    public void removeDislikeFromComment(Long commentId, Long userId) {
        dislikeRepository.deleteByCommentIdAndUserId(commentId, userId);
    }
    public Long getCommentDislikeCount(Long commentId) {
        return dislikeRepository.countByCommentId(commentId);
    }
}
