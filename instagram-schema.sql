CREATE TABLE users (
  user_id INTEGER PRIMARY KEY,
  username VARCHAR(25) UNIQUE NOT NULL,
  password TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL
    CHECK (position('@' IN email) > 1),
  profile_image_url TEXT,
  bio TEXT,
);

CREATE TABLE follows (
  user_being_followed_id INTEGER 
    REFERENCES users ON DELETE CASCADE,
  user_following_id INTEGER
    REFERENCES users ON DELETE CASCADE
)

CREATE TABLE likes (
  user_id INTEGER
    REFERENCES users ON DELETE CASCADE,
  photo_id INTEGER 
    REFERENCES photos ON DELETE CASCADE,
  PRIMARY KEY (user_id, photo_id)
)

CREATE TABLE comments (
  user_id INTEGER
    REFERENCES users ON DELETE CASCADE,
  photo_id INTEGER 
    REFERENCES photos ON DELETE CASCADE,
  comment TEXT,
  PRIMARY KEY (user_id, photo_id)
)

CREATE TABLE photos (
   photo_id INTEGER PRIMARY KEY,
   photo_url TEXT, 
   caption TEXT,
   time_created TIMESTAMP,
   user_id INTEGER
    REFERENCES users ON DELETE CASCADE
)
