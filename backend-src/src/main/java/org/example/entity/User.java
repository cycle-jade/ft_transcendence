package org.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // USER DATA: IDENTITY
    @Column(nullable = false, unique = true)
    private String nickname;

    @Column(nullable = false)
    private String password;

    private String name;
    private String lastName;

    @Column(unique = true)
    private String email;

    @Column(unique = true)
    private String phone;

    // USER DATA: STATUS
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRoles role;

    private boolean bannedStatus;

    private String about;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus onlineStatus;

    private LocalDateTime lastSeenAt;

    // USER OWNED OBJECTS
    @OneToOne(mappedBy = "user")
    @JsonIgnore
    private Profile profile;

    @OneToMany(mappedBy = "user")
    private List<Post> posts;

    @OneToMany(mappedBy = "admin")
    private List<Channel> administrativeChannels;

    @ManyToMany
    @JoinTable(
            name = "channel_members",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "channel_id")
    )
    private List<Channel> channels;

    @ManyToMany
    @JoinTable(
            name = "user_skills",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    private Set<Skill> skills = new HashSet<>();

    // USER SOCIAL
    @ManyToMany
    @JoinTable(
            name = "user_following",
            joinColumns =  @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "following_id")
    )
    @JsonIgnore
    private List<User> following;

    @ManyToMany
    @JoinTable(
            name = "user_followers",
            joinColumns =  @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "follower_id")
    )
    @JsonIgnore
    private List<User> followers;

    // USER CONSTRUCTOR
    public User (String Nickname, String password, String email)
    {
        this.nickname = Nickname;
        this.email = email;
        this.password = password;
        this.role = UserRoles.USER;
        this.onlineStatus = UserStatus.OFFLINE;
        this.bannedStatus = false;
    }

}
