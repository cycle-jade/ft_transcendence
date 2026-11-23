package org.example.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.example.dto.PostAttachmentDownload;
import org.example.dto.PostAttachmentDto;
import org.example.entity.Post;
import org.example.entity.PostAttachment;
import org.example.repo.PostAttachmentRepository;
import org.example.repo.PostRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PostAttachmentService {

    private final PostAttachmentRepository postAttachmentRepository;
    private final PostRepository postRepository;

    @Value("${app.uploads.posts-dir}")
    private String postsDir;

    @Transactional
    public PostAttachmentDto uploadAttachment(Long postId, Long userId, MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }

        Post post = getPostForOwner(postId, userId);
        String originalFileName = cleanFileName(file.getOriginalFilename());
        String storedFileName = UUID.randomUUID() + "_" + originalFileName;
        Path postDirectory = getPostDirectory(postId);
        Path target = postDirectory.resolve(storedFileName).normalize();

        try {
            Files.createDirectories(postDirectory);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save file", e);
        }

        PostAttachment attachment = new PostAttachment();
        attachment.setPost(post);
        attachment.setOriginalFileName(originalFileName);
        attachment.setStoredFileName(storedFileName);
        attachment.setContentType(file.getContentType());
        attachment.setSize(file.getSize());
        attachment.setCreatedAt(LocalDateTime.now());

        attachment = postAttachmentRepository.save(attachment);
        attachment.setUrl("/api/v1/posts/" + postId + "/attachments/" + attachment.getId() + "/download");

        return toDto(postAttachmentRepository.save(attachment));
    }

    public List<PostAttachmentDto> getAttachments(Long postId) {
        if (!postRepository.existsById(postId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found");
        }

        return postAttachmentRepository.findByPostId(postId).stream()
                .map(this::toDto)
                .toList();
    }

    public PostAttachmentDownload downloadAttachment(Long postId, Long attachmentId) {
        PostAttachment attachment = postAttachmentRepository.findByIdAndPostId(attachmentId, postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"));

        Path postDirectory = getPostDirectory(postId);
        Path filePath = postDirectory.resolve(attachment.getStoredFileName()).normalize();
        if (!filePath.startsWith(postDirectory.normalize()) || !Files.exists(filePath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        }

        return new PostAttachmentDownload(
                new FileSystemResource(filePath),
                attachment.getOriginalFileName(),
                attachment.getContentType(),
                attachment.getSize()
        );
    }

    @Transactional
    public void deleteAttachment(Long postId, Long attachmentId, Long userId) {
        getPostForOwner(postId, userId);
        PostAttachment attachment = postAttachmentRepository.findByIdAndPostId(attachmentId, postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"));

        Path filePath = getPostDirectory(postId).resolve(attachment.getStoredFileName()).normalize();
        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not delete file", e);
        }
        postAttachmentRepository.delete(attachment);
    }

    private Post getPostForOwner(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));

        if (!post.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot change attachments for someone else's post");
        }

        return post;
    }

    private Path getPostDirectory(Long postId) {
        return Path.of(postsDir).resolve(String.valueOf(postId)).normalize();
    }

    private String cleanFileName(String fileName) {
        String cleaned = StringUtils.cleanPath(fileName == null ? "file" : fileName);
        if (cleaned.contains("..")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file name");
        }

        return cleaned.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private PostAttachmentDto toDto(PostAttachment attachment) {
        return new PostAttachmentDto(
                attachment.getId(),
                attachment.getPost().getId(),
                attachment.getOriginalFileName(),
                attachment.getContentType(),
                attachment.getSize(),
                attachment.getUrl(),
                attachment.getCreatedAt()
        );
    }
}
