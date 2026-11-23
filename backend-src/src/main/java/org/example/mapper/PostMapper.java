package org.example.mapper;

import jakarta.validation.constraints.NotNull;
import org.example.dto.PostDto;
import org.example.entity.Post;
import org.example.entity.Comment;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;


@Component
public class PostMapper {

    public PostDto toDto(@NotNull Post post) {
        PostDto dto = new PostDto();

        dto.setId(post.getId());
        dto.setUserId(post.getUser().getId());
        dto.setUserNickname(post.getUser().getNickname());
        dto.setTitle(post.getTitle());
        dto.setContent(post.getContent());
        dto.setIdChannel(post.getChannel() == null ? null : post.getChannel().getId());
        dto.setChannelName(post.getChannel() == null ? null : post.getChannel().getName());
        dto.setLikes(post.getLikes() == null ? 0L : (long) post.getLikes().size());
        dto.setDislikes(post.getDislikes() == null ? 0L : (long) post.getDislikes().size());

        dto.setIdComments(
                post.getComments() == null
                        ? List.of()
                        : post.getComments()
                        .stream()
                        .map(Comment::getId)
                        .collect(Collectors.toList())
        );

        dto.setDataCreated(post.getDataCreated());
        dto.setDataEdited(post.getDataEdited());
        dto.setDataDeleted(post.getDataDeleted());

        return dto;
    }

    public Post toPost(PostDto dto) {
        Post post = new Post();

        post.setTitle(dto.getTitle());
        post.setContent(dto.getContent());
        post.setDataCreated(dto.getDataCreated());

        return post;
    }


}
