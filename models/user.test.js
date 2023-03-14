'use strict';

const { NotFoundError, BadRequestError, UnauthorizedError } = require('../expressError');
const db = require('../db.js');
const User = require('./user.js');
const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	testPostsCreatedAt,
	testCommentsCreatedAt
} = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** authenticate */

describe('authenticate', function() {
	test('works', async function() {
		const user = await User.authenticate('u1', 'password1');
		expect(user).toEqual({
			username: 'u1',
			fullName: 'U1FN',
			email: 'u1@email.com',
			profileImageURL: './public/images/default-pic.png',
			bio: 'test_user 1 stuff'
		});
	});

	test('unauth if no such user', async function() {
		try {
			await User.authenticate('nope', 'password');
			fail();
		} catch (err) {
			expect(err instanceof UnauthorizedError).toBeTruthy();
		}
	});

	test('unauth if wrong password', async function() {
		try {
			await User.authenticate('c1', 'wrong');
			fail();
		} catch (err) {
			expect(err instanceof UnauthorizedError).toBeTruthy();
		}
	});
});

/************************************** register */

describe('register', function() {
	const newUser = {
		username: 'new',
		fullName: 'Test',
		email: 'test@test.com',
		profileImageURL: null,
		bio: 'new Test stuff'
	};

	test('works', async function() {
		let user = await User.register({
			...newUser,
			password: 'password'
		});
		expect(user).toEqual(newUser);
		const found = await db.query(`SELECT * FROM users WHERE username = 'new'`);
		expect(found.rows.length).toEqual(1);
		expect(found.rows[0].password.startsWith('$2b$')).toEqual(true);
	});

	test('bad request with dup data', async function() {
		try {
			await User.register({
				...newUser,
				password: 'password'
			});
			await User.register({
				...newUser,
				password: 'password'
			});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

/************************************** findAll */

describe('findAll', function() {
	test('works', async function() {
		const users = await User.findAll();
		expect(users).toEqual([
			{
				username: 'u1',
				fullName: 'U1FN',
				profileImageURL: './public/images/default-pic.png',
				bio: 'test_user 1 stuff'
			},
			{
				username: 'u2',
				fullName: 'U2FN',
				profileImageURL: './public/images/default-pic.png',
				bio: 'test_user 2 stuff'
			},
			{
				username: 'u3',
				fullName: 'U3FN',
				profileImageURL: './public/images/default-pic.png',
				bio: 'test_user 3 stuff'
			},
			{
				username: 'u4',
				fullName: 'U4FN',
				profileImageURL: './public/images/default-pic.png',
				bio: 'test_user 4 stuff'
			}
		]);
	});

	test('works: by name', async function() {
		let users = await User.findAll({ name: '1' });
		expect(users).toEqual([
			{
				username: 'u1',
				fullName: 'U1FN',
				profileImageURL: './public/images/default-pic.png',
				bio: 'test_user 1 stuff'
			}
		]);
	});

	test('works: empty list on nothing found', async function() {
		let users = await User.findAll({ name: 'nope' });
		expect(users).toEqual([]);
	});
});

/************************************** get */

describe('get', function() {
	test('works', async function() {
		let user = await User.get('u1');
		expect(user).toEqual({
			username: 'u1',
			fullName: 'U1FN',
			email: 'u1@email.com',
			profileImageURL: './public/images/default-pic.png',
			bio: 'test_user 1 stuff',
			posts: [
				{
					postId: 1,
					postURL:
						'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc14uK4IYYBB8TU2JnCEmxKMeGEbfw_flCuQ&usqp=CAU',
					caption: 'a fake post by u1',
					watermark: null,
					filter: null,
					createdAt: testPostsCreatedAt[0]
				}
			],
			postLikes: [
				{
					postId: 1,
					username: 'u1',
					postURL:
						'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc14uK4IYYBB8TU2JnCEmxKMeGEbfw_flCuQ&usqp=CAU',
					caption: 'a fake post by u1',
					watermark: null,
					filter: null,
					createdAt: testPostsCreatedAt[0]
				},
				{
					postId: 2,
					username: 'u2',
					postURL:
						'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc14uK4IYYBB8TU2JnCEmxKMeGEbfw_flCuQ&usqp=CAU',
					caption: 'a fake post by u2',
					watermark: null,
					filter: null,
					createdAt: testPostsCreatedAt[1]
				}
			],
			following: [
				{
					username: 'u2',
					fullName: 'U2FN',
					profileImageURL: './public/images/default-pic.png'
				},
				{
					username: 'u3',
					fullName: 'U3FN',
					profileImageURL: './public/images/default-pic.png'
				},
				{
					username: 'u4',
					fullName: 'U4FN',
					profileImageURL: './public/images/default-pic.png'
				}
			],
			followers: [
				{
					username: 'u2',
					fullName: 'U2FN',
					profileImageURL: './public/images/default-pic.png'
				},
				{
					username: 'u3',
					fullName: 'U3FN',
					profileImageURL: './public/images/default-pic.png'
				}
			]
		});
	});

	test('not found if no such user', async function() {
		try {
			await User.get('nope');
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

/************************************** update */

describe('update', function() {
	const updateData = {
		fullName: 'NewF',
		email: 'new@email.com'
	};

	test('works', async function() {
		let updatedUser = await User.update('u1', updateData);
		expect(updatedUser).toEqual({
			username: 'u1',
			...updateData,
			profileImageURL: './public/images/default-pic.png',
			bio: 'test_user 1 stuff'
		});
	});

	test('works: set password', async function() {
		let updatedUser = await User.update('u1', {
			password: 'new'
		});
		expect(updatedUser).toEqual({
			username: 'u1',
			fullName: 'U1FN',
			email: 'u1@email.com',
			profileImageURL: './public/images/default-pic.png',
			bio: 'test_user 1 stuff'
		});
		const found = await db.query(`SELECT * FROM users WHERE username = 'u1'`);
		expect(found.rows.length).toEqual(1);
		expect(found.rows[0].password.startsWith('$2b$')).toEqual(true);
	});

	test('not found if no such user', async function() {
		try {
			await User.update('nope', {
				fullName: 'test'
			});
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	test('bad request if no data', async function() {
		expect.assertions(1);
		try {
			await User.update('u1', {});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

/************************************** remove */

describe('remove', function() {
	test('works', async function() {
		await User.remove('u1');
		const res = await db.query(`SELECT * FROM users WHERE username='u1'`);
		expect(res.rows.length).toEqual(0);
	});

	test('not found if no such user', async function() {
		try {
			await User.remove('nope');
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

/************************************** follow */

describe('follow', function() {
	test('works', async function() {
		await User.follow('u2', 'u3');

		const res = await db.query(`SELECT * FROM follows WHERE username_following='u2'`);
		expect(res.rows).toEqual([
			{
				username_being_followed: 'u1',
				username_following: 'u2'
			},
			{
				username_being_followed: 'u3',
				username_following: 'u2'
			}
		]);
	});

	test('not found if no such user', async function() {
		try {
			await User.follow('u1', 'u5');
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	test('not found if no such user', async function() {
		try {
			await User.follow('nope', 'u1');
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

/************************************** createPost */

describe('creating a post', function() {
	test('works', async function() {
		const newPost = {
			postURL: 'https://fake-photo',
			caption: 'a fake post by u4',
			watermark: null,
			watermarkFont: null,
			filter: null,
			username: 'u4'
		};
		const post = await User.createPost({ ...newPost });
		const res = await db.query(
			`SELECT post_id AS "postId", post_url AS "postURL", caption, watermark, watermark_font AS "watermarkFont", filter, created_at AS "createdAt", username FROM posts WHERE username='u4'`
		);
		expect(res.rows.length).toEqual(1);
		expect(res.rows[0]).toEqual(post);
	});

	test('not  if no such user', async function() {
		const newPost = {
			postURL: 'https://fake-photo',
			caption: 'a fake post by u4',
			watermark: null,
			watermarkFont: null,
			filter: null,
			username: 'nope'
		};
		try {
			await User.createPost({ ...newPost });
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

/************************************** like */

describe('liking', function() {
	test('works for liking a comment', async function() {
		await User.like('u1', 1, { type: 'comment' });

		const res = await db.query(`SELECT * FROM comment_likes WHERE username='u1'`);
		expect(res.rows.length).toEqual(1);
		expect(res.rows[0]).toEqual({
			comment_like_id: 1,
			username: 'u1',
			comment_id: 1
		});
	});
	test('works for liking a post', async function() {
		await User.like('u1', 3, { type: 'post' });

		const res = await db.query(`SELECT * FROM post_likes WHERE post_id=3`);
		expect(res.rows.length).toEqual(1);
		expect(res.rows[0]).toEqual({
			post_like_id: 3,
			username: 'u1',
			post_id: 3
		});
	});
});

/************************************** like */

describe('commenting', function() {
	test('works for commenting on a post', async function() {
		const newComment = {
			username: 'u1',
			postId: 2,
			parentId: -1,
			message: 'nice post, u2!'
		};
		const comment = await User.comment({ ...newComment });
		const res = await db.query(
			`SELECT comment_id AS "commentId", parent_id AS "parentId", message, created_at AS "createdAt", username, post_id AS "postId" FROM comments WHERE username='u1'`
		);
		expect(res.rows.length).toEqual(1);
		expect(res.rows[0]).toEqual(comment);
	});

	test('works for replying to a comment', async function() {
		const newComment = {
			username: 'u2',
			postId: 2,
			parentId: 2,
			message: 'thank you, u1!'
		};
		const comment = await User.comment({ ...newComment });
		const res = await db.query(
			`SELECT comment_id AS "commentId", parent_id AS "parentId", message, created_at AS "createdAt", username, post_id AS "postId" FROM comments WHERE message='thank you, u1!'`
		);
		expect(res.rows.length).toEqual(1);
		expect(res.rows[0]).toEqual(comment);
	});
});

/************************************** getUserComments */

describe('getting all of specific user comments', function() {
	test('works for comments with likes', async function() {
		await User.like('u1', 1, { type: 'comment' });
		await User.like('u1', 2, { type: 'comment' });
		await User.like('u3', 1, { type: 'comment' });
		await User.like('u3', 2, { type: 'comment' });
		await User.like('u4', 2, { type: 'comment' });
		let user = await User.getUserComments('u2');
		expect(user).toEqual({
			username: 'u2',
			comments: [
				{
					commentId: 1,
					parentId: -1,
					message: 'nice post, u1!',
					createdAt: testCommentsCreatedAt[0],
					postId: 1,
					likes: '2'
				},
				{
					commentId: 2,
					parentId: -1,
					message: 'here are some hashtags I forgot!',
					createdAt: testCommentsCreatedAt[1],
					postId: 2,
					likes: '3'
				}
			]
		});
	});

	test('works for comments without likes', async function() {
		const newComment = {
			username: 'u3',
			postId: '1',
			parentId: -1,
			message: 'yeah, u1, what a great post!'
		};
		const comment = await User.comment({ ...newComment });
		const userU3Comment = await User.getUserComments('u3');
		expect(userU3Comment).toEqual({
			username: 'u3',
			comments: [ comment ]
		});
	});
});
