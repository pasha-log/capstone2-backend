CREATE TABLE users (
  username VARCHAR(30) PRIMARY KEY,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL
    CHECK (position('@' IN email) > 1),
  profile_image_url TEXT DEFAULT './public/images/default-pic.png',
  bio VARCHAR(2200) 
);

CREATE TABLE posts (
  post_id SERIAL PRIMARY KEY,
  post_url TEXT NOT NULL, 
  caption VARCHAR(2200) DEFAULT NULL, 
  watermark VARCHAR(35) DEFAULT NULL,
  watermark_font VARCHAR(35) DEFAULT NULL,
  filter VARCHAR(10) DEFAULT NULL,
  created_at timestamp without time zone NOT NULL
   DEFAULT (current_timestamp AT TIME ZONE 'PST'),
  username VARCHAR(30) REFERENCES users(username) ON DELETE CASCADE NOT NULL
);

CREATE TABLE follows (
  username_being_followed VARCHAR(30) REFERENCES users(username) ON DELETE CASCADE NOT NULL,
  username_following VARCHAR(30) REFERENCES users(username) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (username_being_followed, username_following)
);

CREATE TABLE post_likes (
  post_like_id SERIAL PRIMARY KEY,
  username VARCHAR(30) REFERENCES users(username) ON DELETE CASCADE NOT NULL,
  post_id SERIAL REFERENCES posts(post_id) ON DELETE CASCADE NOT NULL
);

CREATE TABLE comments (
  comment_id SERIAL PRIMARY KEY,
  parent_id INTEGER DEFAULT -1,
  message VARCHAR(2200) NOT NULL,
  created_at timestamp without time zone NOT NULL
    DEFAULT (current_timestamp AT TIME ZONE 'PST'),
  username VARCHAR(30) REFERENCES users(username) ON DELETE CASCADE NOT NULL,
  post_id SERIAL REFERENCES posts(post_id) ON DELETE CASCADE NOT NULL
);

CREATE TABLE comment_likes (
  comment_like_id SERIAL PRIMARY KEY,
  username VARCHAR(30) REFERENCES users(username) ON DELETE CASCADE NOT NULL,
  comment_id SERIAL REFERENCES comments(comment_id) ON DELETE CASCADE NOT NULL
);


