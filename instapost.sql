\echo 'Delete and recreate instagram db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE instapost;
CREATE DATABASE instapost;
\connect instapost

\i instapost-schema.sql
\i instapost-seed.sql

\echo 'Delete and recreate instagram_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE instapost_test;
CREATE DATABASE instapost_test;
\connect instapost_test

\i instapost-schema.sql
