create table users (
    id bigserial primary key,
    nickname varchar(255),
    password varchar(255),
    name varchar(255),
    last_name varchar(255),
    email varchar(255),
    phone varchar(255),
    role varchar(255) not null default 'USER',
    online_status varchar(255) not null default 'OFFLINE',
    last_seen_at timestamp(6),
    banned_status boolean not null default false,
    about varchar(255)
);

create table posts (
    id bigserial primary key,
    user_id bigint,
    channel_id bigint,
    title varchar(255),
    content varchar(255),
    data_created timestamp(6),
    data_edited timestamp(6),
    data_deleted timestamp(6),
    constraint fk_posts_user foreign key (user_id) references users (id)
);

create table channels (
    id bigserial primary key,
    name varchar(255),
    description varchar(255),
    admin_id bigint,
    constraint fk_channels_admin foreign key (admin_id) references users (id)
);

alter table posts
    add constraint fk_posts_channel foreign key (channel_id) references channels (id);

create table comments (
    id bigserial primary key,
    post_id bigint,
    user_id bigint,
    content varchar(255),
    data_created timestamp(6),
    data_edited timestamp(6),
    data_deleted timestamp(6)
);

create table likes (
    id bigserial primary key,
    post_id bigint,
    comment_id bigint,
    user_id bigint
);

create table dislikes (
    id bigserial primary key,
    post_id bigint,
    comment_id bigint,
    user_id bigint
);

create table channel_members (
    user_id bigint not null,
    channel_id bigint not null,
    primary key (user_id, channel_id),
    constraint fk_channel_members_user foreign key (user_id) references users (id),
    constraint fk_channel_members_channel foreign key (channel_id) references channels (id)
);

create table posts_likes (
    post_id bigint not null,
    likes_id bigint not null unique,
    constraint fk_posts_likes_post foreign key (post_id) references posts (id),
    constraint fk_posts_likes_like foreign key (likes_id) references likes (id)
);

create table posts_dislikes (
    post_id bigint not null,
    dislikes_id bigint not null unique,
    constraint fk_posts_dislikes_post foreign key (post_id) references posts (id),
    constraint fk_posts_dislikes_dislike foreign key (dislikes_id) references dislikes (id)
);

create table comments_likes (
    comment_id bigint not null,
    likes_id bigint not null unique,
    constraint fk_comments_likes_comment foreign key (comment_id) references comments (id),
    constraint fk_comments_likes_like foreign key (likes_id) references likes (id)
);

create table comments_dislikes (
    comment_id bigint not null,
    dislikes_id bigint not null unique,
    constraint fk_comments_dislikes_comment foreign key (comment_id) references comments (id),
    constraint fk_comments_dislikes_dislike foreign key (dislikes_id) references dislikes (id)
);

create table user_followers (
                                user_id bigint not null,
                                follower_id bigint not null,
                                primary key (user_id, follower_id),
                                constraint fk_user_follower_user foreign key (user_id) references users (id),
                                constraint fk_user_follower_follower foreign key (follower_id) references users (id)
);

create table user_following(
                                user_id bigint not null,
                                following_id bigint not null,
                                primary key (user_id, following_id),
                                constraint fk_user_following_user foreign key (user_id) references users (id),
                                constraint fk_user_following_follower foreign key (following_id) references users (id)
);create table profiles (
    id bigserial primary key,
    user_id bigint not null unique,
    display_name varchar(80),
    bio varchar(500),
    avatar_url varchar(255),
    location varchar(255),
    website_url varchar(255),
    created_at timestamp(6),
    updated_at timestamp(6),
    constraint fk_profiles_user foreign key (user_id) references users (id)
);
alter table users
    add column if not exists role varchar(255) not null default 'USER',
    add column if not exists online_status varchar(255) not null default 'OFFLINE',
    add column if not exists last_seen_at timestamp(6),
    add column if not exists banned_status boolean not null default false,
    add column if not exists about varchar(255);
alter table users
    drop column if exists followers_id;

create table if not exists channel_members (
    user_id bigint not null,
    channel_id bigint not null,
    primary key (user_id, channel_id),
    constraint fk_channel_members_user foreign key (user_id) references users (id),
    constraint fk_channel_members_channel foreign key (channel_id) references channels (id)
);

do $$
begin
    if to_regclass('users_channels') is not null then
        insert into channel_members (user_id, channel_id)
        select user_id, channels_id
        from users_channels
        on conflict do nothing;
    end if;

    if to_regclass('channels_members') is not null then
        insert into channel_members (user_id, channel_id)
        select members_id, channel_id
        from channels_members
        on conflict do nothing;
    end if;

    if to_regclass('users_posts') is not null then
        update posts
        set user_id = users_posts.user_id
        from users_posts
        where posts.id = users_posts.posts_id
          and posts.user_id is null;
    end if;

    if to_regclass('channels_posts') is not null then
        update posts
        set channel_id = channels_posts.channel_id
        from channels_posts
        where posts.id = channels_posts.posts_id
          and posts.channel_id is null;
    end if;

    if to_regclass('posts_comments') is not null then
        update comments
        set post_id = posts_comments.post_id
        from posts_comments
        where comments.id = posts_comments.comments_id
          and comments.post_id is null;
    end if;
end $$;

drop table if exists users_posts;
drop table if exists users_channels;
drop table if exists channels_members;
drop table if exists channels_posts;
drop table if exists posts_comments;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'fk_posts_channel'
    ) then
        alter table posts
            add constraint fk_posts_channel foreign key (channel_id) references channels (id);
    end if;
end $$;
CREATE TABLE post_attachments
(
    id                 BIGINT GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    post_id            BIGINT                                  NOT NULL,
    original_file_name VARCHAR(255),
    stored_file_name   VARCHAR(255),
    content_type       VARCHAR(255),
    size               BIGINT,
    url                VARCHAR(255),
    created_at         TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT pk_post_attachments PRIMARY KEY (id)
);

ALTER TABLE post_attachments
    ADD CONSTRAINT FK_POST_ATTACHMENTS_ON_POST FOREIGN KEY (post_id) REFERENCES posts (id);
CREATE TABLE avatars
(
    id                 BIGINT GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    profile_id            BIGINT                                  NOT NULL UNIQUE ,
    original_file_name VARCHAR(255),
    stored_file_name   VARCHAR(255),
    content_type       VARCHAR(255),
    size               BIGINT,
    url                VARCHAR(255),
    created_at         TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT pk_avatar PRIMARY KEY (id)
);

ALTER TABLE avatars
    ADD CONSTRAINT FK_AVATAR_ON_PROFILE FOREIGN KEY (profile_id) REFERENCES profiles (id);
CREATE TABLE email_verification_codes
(
    id              BIGINT GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    user_id         BIGINT                                  NOT NULL,
    verification_id VARCHAR(255)                            NOT NULL,
    code_hash       VARCHAR(255)                            NOT NULL,
    expires_at      TIMESTAMP WITHOUT TIME ZONE             NOT NULL,
    used            BOOLEAN                                 NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITHOUT TIME ZONE             NOT NULL,
    CONSTRAINT pk_email_verification_codes PRIMARY KEY (id),
    CONSTRAINT uk_email_verification_codes_verification_id UNIQUE (verification_id),
    CONSTRAINT fk_email_verification_codes_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_email_verification_codes_user_id ON email_verification_codes (user_id);
CREATE TABLE IF NOT EXISTS skills
(
    id          BIGINT GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    name        VARCHAR(255) UNIQUE,
    CONSTRAINT pk_skills PRIMARY KEY (id)
);


create table  user_skills(
                             user_id bigint not null,
                             skill_id bigint not null,
                             primary key (user_id, skill_id),
                             constraint  fk_user_skills_user foreign key (user_id) references users (id),
                             constraint  fk_user_skills_skill foreign key (skill_id) references skills (id)
);
-- Add ON DELETE CASCADE to all FK constraints referencing users(id),
-- and to dependent tables that block the cascade chain.

-- Direct FK refs to users
ALTER TABLE channel_members DROP CONSTRAINT fk_channel_members_user;
ALTER TABLE channel_members ADD CONSTRAINT fk_channel_members_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- channels.admin_id: SET NULL so the channel survives when its admin is deleted
ALTER TABLE channels DROP CONSTRAINT fk_channels_admin;
ALTER TABLE channels ADD CONSTRAINT fk_channels_admin
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE email_verification_codes DROP CONSTRAINT fk_email_verification_codes_user;
ALTER TABLE email_verification_codes ADD CONSTRAINT fk_email_verification_codes_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE posts DROP CONSTRAINT fk_posts_user;
ALTER TABLE posts ADD CONSTRAINT fk_posts_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE profiles DROP CONSTRAINT fk_profiles_user;
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_followers DROP CONSTRAINT fk_user_follower_user;
ALTER TABLE user_followers ADD CONSTRAINT fk_user_follower_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_followers DROP CONSTRAINT fk_user_follower_follower;
ALTER TABLE user_followers ADD CONSTRAINT fk_user_follower_follower
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_following DROP CONSTRAINT fk_user_following_user;
ALTER TABLE user_following ADD CONSTRAINT fk_user_following_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_following DROP CONSTRAINT fk_user_following_follower;
ALTER TABLE user_following ADD CONSTRAINT fk_user_following_follower
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_skills DROP CONSTRAINT fk_user_skills_user;
ALTER TABLE user_skills ADD CONSTRAINT fk_user_skills_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Post cascade chain: clean up join tables and attachments when a post is deleted
ALTER TABLE post_attachments DROP CONSTRAINT fk_post_attachments_on_post;
ALTER TABLE post_attachments ADD CONSTRAINT fk_post_attachments_on_post
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

ALTER TABLE posts_likes DROP CONSTRAINT fk_posts_likes_post;
ALTER TABLE posts_likes ADD CONSTRAINT fk_posts_likes_post
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

ALTER TABLE posts_dislikes DROP CONSTRAINT fk_posts_dislikes_post;
ALTER TABLE posts_dislikes ADD CONSTRAINT fk_posts_dislikes_post
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

-- Profile cascade chain: delete avatars when profile is deleted
ALTER TABLE avatars DROP CONSTRAINT fk_avatar_on_profile;
ALTER TABLE avatars ADD CONSTRAINT fk_avatar_on_profile
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
