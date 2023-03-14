-- both test users have the password "password"

INSERT INTO users (username, password, full_name, email, profile_image_url, bio)
VALUES ('testuser',
        '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
        'Test User',
        'joel@joelburton.com',
        null,
        'Welcome to my profile'),
       ('pashathecoder',
        '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
        'Pasha',
        'Loguinov',
        'pasha.log@gmail.com',
        null,
        'This is my profile, everyone. Hello world.');