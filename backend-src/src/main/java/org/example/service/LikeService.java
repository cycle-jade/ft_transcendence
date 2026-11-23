package org.example.service;

import lombok.RequiredArgsConstructor;
import org.example.entity.Comment;
import org.example.entity.Like;
import org.example.entity.Post;
import org.example.entity.User;
import org.example.exception.ResourceNotFoundException;
import org.example.repo.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final LikeRepository likeRepository;
    private final DislikeRepository dislikeRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

    // POSTS
    @Transactional
    public void likePost(Long postId, Long userId) {
        if (likeRepository.existsByPostIdAndUserId(postId, userId)) return;

        if (dislikeRepository.existsByPostIdAndUserId(postId, userId)) {
            dislikeRepository.deleteByPostIdAndUserId(postId, userId);
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Like like = new Like();
        like.setPost(post);
        like.setUser(user);

        likeRepository.save(like);
    }

    @Transactional
    public void removeLikeFromPost(Long postId, Long userId) {
        likeRepository.deleteByPostIdAndUserId(postId, userId);
    }

    public int getPostLikeCount(Long postId) {
        return likeRepository.countByPostId(postId);
    }

    // COMMENTS
    @Transactional
    public void likeComment(Long commentId, Long userId) {
        if (likeRepository.existsByCommentIdAndUserId(commentId, userId)) return;
        if (dislikeRepository.existsByCommentIdAndUserId(commentId, userId)) {
            dislikeRepository.deleteByCommentIdAndUserId(commentId, userId);
        }

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Like like = new Like();
        like.setComment(comment);
        like.setUser(user);

        likeRepository.save(like);
    }

    @Transactional
    public void removeLikeFromComment(Long commentId, Long userId) {
        likeRepository.deleteByCommentIdAndUserId(commentId, userId);
    }

    public int getCommentLikeCount(Long commentId) {
        return likeRepository.countByCommentId(commentId);
    }
}
