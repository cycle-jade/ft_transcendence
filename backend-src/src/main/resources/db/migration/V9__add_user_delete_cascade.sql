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
