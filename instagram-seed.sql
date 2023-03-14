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
        'Pasha Loguinov',
        'pasha.log@gmail.com',
        'https://scontent-sjc3-1.cdninstagram.com/v/t51.2885-19/133861693_405576800658090_4354625989364868756_n.jpg?stp=dst-jpg_s320x320&_nc_ht=scontent-sjc3-1.cdninstagram.com&_nc_cat=106&_nc_ohc=9xobDKLuP6wAX-X3xyP&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfDogN8JA7hwsastJzxmYno0c29nLekJ3Fh-psIumQ-pcg&oe=64161E00&_nc_sid=8fd12b',
        'This is my profile, everyone. Hello world U+1F30E.');