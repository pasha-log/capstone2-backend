\echo 'Delete and recreate instagram db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE instagram;
CREATE DATABASE instagram;
\connect instagram

\i instagram-schema.sql
\i instagram-seed.sql

\echo 'Delete and recreate instagram_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE instagram_test;
CREATE DATABASE instagram_test;
\connect instagram_test

\i instagram-schema.sql
