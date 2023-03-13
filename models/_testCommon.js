const bcrypt = require('bcrypt');

const db = require('../db.js');
const { BCRYPT_WORK_FACTOR } = require('../config');

const testCreatedAt = [];

async function commonBeforeAll() {
	await db.query('DELETE FROM users');

	await db.query(
		`
        INSERT INTO users(username,
                          password,
                          full_name,
                          email,
                          bio)
        VALUES ('u1', $1, 'U1FN', 'u1@email.com', 'test_user 1 stuff'),
               ('u2', $2, 'U2FN', 'u2@email.com', 'test_user 2 stuff'),
               ('u3', $3, 'U3FN', 'u3@email.com', 'test_user 3 stuff'),
               ('u4', $4, 'U4FN', 'u4@email.com', 'test_user 4 stuff')
        RETURNING username`,
		[
			await bcrypt.hash('password1', BCRYPT_WORK_FACTOR),
			await bcrypt.hash('password2', BCRYPT_WORK_FACTOR),
			await bcrypt.hash('password3', BCRYPT_WORK_FACTOR),
			await bcrypt.hash('password4', BCRYPT_WORK_FACTOR)
		]
	);

	// u1 will be following everyone
	// only u2 and u3 will be following u1 back
	await db.query(
		`
	    INSERT INTO follows(username_being_followed, username_following)
	    VALUES ('u2', 'u1'), ('u3', 'u1'), ('u4', 'u1'), ('u1', 'u2'), ('u1', 'u3')`
	);

	// u1, u2, u3 will all have posts
	const resultsPosts = await db.query(
		`
		INSERT INTO posts(username, post_url, caption)
		VALUES ('u1', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc14uK4IYYBB8TU2JnCEmxKMeGEbfw_flCuQ&usqp=CAU', 'a fake post by u1'), 
		('u2', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc14uK4IYYBB8TU2JnCEmxKMeGEbfw_flCuQ&usqp=CAU', 'a fake post by u2'),
		('u3', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc14uK4IYYBB8TU2JnCEmxKMeGEbfw_flCuQ&usqp=CAU', 'a fake post by u3')
		RETURNING created_at`
	);
	testCreatedAt.splice(0, 0, ...resultsPosts.rows.map((r) => r.created_at));

	// u1 will like u2's post and their own post
	await db.query(
		`
		INSERT INTO post_likes(username, post_id)
		VALUES ('u1', 1), ('u1', 2)`
	);

	// u2 will make a comment on u1's post and u1 will like it
	await db.query(
		`
		INSERT INTO comments(message, username, post_id)
		VALUES ('nice post, u1!', 'u2', '1')`
	);
}

async function commonBeforeEach() {
	await db.query('BEGIN');
}

async function commonAfterEach() {
	await db.query('ROLLBACK');
}

async function commonAfterAll() {
	await db.end();
}

module.exports = {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	testCreatedAt
};
