'use strict';

const { NotFoundError, BadRequestError, UnauthorizedError } = require('../expressError');
const db = require('../db.js');
const User = require('./user.js');
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require('../config');
const { commonBeforeEach, commonAfterEach, commonAfterAll } = require('./_testCommon');

beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** authenticate */

describe('authenticate', function() {
	test('works', async function() {
		await db.query(
			`
			INSERT INTO users (username, password, full_name, profile_image_url, email, bio)
			VALUES ('u1', $1, 'U1FN', './public/images/default-pic.png', 'u1@email.com', 'test_user 1 stuff')
			RETURNING username`,
			[ await bcrypt.hash('password1', BCRYPT_WORK_FACTOR) ]
		);
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
		profileImageURL:
			'data:image/png;base64,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',
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
		const users = await User.findAll();
		expect(users).toEqual([
			{
				username: 'u1',
				fullName: 'U1FN',
				profileImageURL:
					'data:image/png;base64,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',
				bio: 'test_user 1 stuff'
			},
			{
				username: 'u2',
				fullName: 'U2FN',
				profileImageURL:
					'data:image/png;base64,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',
				bio: 'test_user 2 stuff'
			},
			{
				username: 'u3',
				fullName: 'U3FN',
				profileImageURL:
					'data:image/png;base64,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',
				bio: 'test_user 3 stuff'
			},
			{
				username: 'u4',
				fullName: 'U4FN',
				profileImageURL:
					'data:image/png;base64,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',
				bio: 'test_user 4 stuff'
			}
		]);
	});

	test('works: by name', async function() {
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
		let users = await User.findAll({ name: '1' });
		expect(users).toEqual([
			{
				username: 'u1',
				fullName: 'U1FN',
				profileImageURL:
					'data:image/png;base64,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',
				bio: 'test_user 1 stuff'
			}
		]);
	});

	test('works: empty list on nothing found', async function() {
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
		let users = await User.findAll({ name: 'nope' });
		expect(users).toEqual([]);
	});
});

/************************************** get */

describe('get', function() {
	test('works', async function() {
		const testPostsCreatedAt = [];
		const testCommentsCreatedAt = [];
		const testPostsPostIds = [];
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
		RETURNING created_at, post_id`
		);
		testPostsCreatedAt.splice(0, 0, ...resultsPosts.rows.map((r) => r.created_at));
		testPostsPostIds.splice(0, 0, ...resultsPosts.rows.map((r) => r.post_id));

		// u1 will like u2's post and their own post
		await db.query(
			`
		INSERT INTO post_likes(username, post_id)
		VALUES ('u1', $1), ('u1', $2)`,
			[ testPostsPostIds[0], testPostsPostIds[1] ]
		);

		// u2 will make a comment on u1's post and u1 will like it, and u2 will comment on their own post
		const resultsComments = await db.query(
			`
		INSERT INTO comments(message, username, post_id)
		VALUES ('nice post, u1!', 'u2', $1), ('here are some hashtags I forgot!', 'u2', $2)
		RETURNING created_at`,
			[ testPostsPostIds[0], testPostsPostIds[1] ]
		);
		testCommentsCreatedAt.splice(0, 0, ...resultsComments.rows.map((r) => r.created_at));
		let user = await User.get('u1');
		expect(user).toEqual({
			username: 'u1',
			fullName: 'U1FN',
			email: 'u1@email.com',
			profileImageURL:
				'data:image/png;base64,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',
			bio: 'test_user 1 stuff',
			posts: [
				{
					postId: testPostsPostIds[0],
					postURL:
						'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc14uK4IYYBB8TU2JnCEmxKMeGEbfw_flCuQ&usqp=CAU',
					caption: 'a fake post by u1',
					watermark: null,
					filter: null,
					createdAt: testPostsCreatedAt[0],
					numComments: '1',
					numLikes: '1'
				}
			],
			postLikes: [
				{
					postId: testPostsPostIds[0],
					username: 'u1',
					postURL:
						'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc14uK4IYYBB8TU2JnCEmxKMeGEbfw_flCuQ&usqp=CAU',
					caption: 'a fake post by u1',
					watermark: null,
					filter: null,
					createdAt: testPostsCreatedAt[0]
				},
				{
					postId: testPostsPostIds[1],
					username: 'u2',
					postURL:
						'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc14uK4IYYBB8TU2JnCEmxKMeGEbfw_flCuQ&usqp=CAU',
					caption: 'a fake post by u2',
					watermark: null,
					filter: null,
					createdAt: testPostsCreatedAt[1]
				}
			],
			commentLikes: [],
			following: [
				{
					username: 'u2',
					fullName: 'U2FN',
					profileImageURL:
						'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAQlBMVEXk5ueutLetsrXo6uvp6+ypr7OqsLSvtbfJzc/f4eKmrbDi5OXl5+fY29zU19m4vcC/w8bHy828wcO1ur7P0tTIzc4ZeVS/AAAGG0lEQVR4nO2d25ajKhCGheKgiGfz/q+6waSzZ5JOd9QiFk59F73W5Mp/ijohlEXBMAzDMAzDMAzDMAzDMAzDMAzDMAzDMAzDMAzDMP8kdVF4AFAA/uhHSUGQ5uuqaee5nOe2qeIPRz8TIkr5ZhitMHek7YY2/H70k6EAUF0m57R4QDtnhyZ/SyrVdsFkj/JuGDPNkLUhoS6Ne6HuhtN9na0dAUppfta3GFL0mdoR2t/sd3dJU2boj+C7p+Dyg8auys2Man4ZXr5FujkvK8Lw5gL9HzdmVOtAMa0WGCNOlYsZoZreCKHPSJmJRKjWueAf6DaHeAPVRnmLxIa+FaHebMGIIS/RF9MegcEZa9oR1audAoWwR2v4GRhWFDLfYzrK0UbNzu5VaHVJ2BXrvUt0gXBAhQ5FobRUFap5txNeMQNRiR7FgovE6mgt3wLDpmr0W4Uk46mv0ASGVopisFEjokLR0VOIakKSRoQeLc5EJEFPxNQX0NTCaajXcBWSy4n7e4oHpCDWReHGmYhrSRkRSnSFpicVa2DCFhjWKallWqObMDZRR6v6A2iRI2lEUuqEVW929/bPjJQUJnDDACFH9DKBCUmVNQ1Sc/83hDKib5Mo1CWZjAgX5JLtiqST85E7p7tCOh0UjCkECjGR8UPo0iiks2+aoipdOFrYnVQK5dHC7kCKfB8V1kcr++IfUHj+VZos0lCpvVNlC0EnW5w/45+/asPfaYsQ2m07f/d0/g64KJL4IaVdjEQJkUo2LJbdxAQCKe0mAva7tYi5EFJ4/l394Ij47QWdujsCl7O/XSsq9IxIKhsWCd5cWEq5IqJKZCNKaicV0MsaSgXNFcRzexFCndMd3FhD8NQX7sk9SfDkHu6RGoomjHsZaBIpeuECmkJdEUuGN85/kh3tNoKkKrDwOE0U4RslOKdM9UD5QjBCPKV5E+GOB7HTFaUg80rtBfXOZt+Qv+0M++pTl8Fd59PfdI4S3VZfzMGCEajsJomSvg9+AYXY4Iwyn6kRRcyLq1O/7ign+mfUZaUzOkqnut9CFdOaCTxTdhN4iuV1zXsarQmlaG4WXAAozTuTsGSuk7ACqh7cLyFHuzHfaWYRBfP0eiKdNFPps7XfFwDVIJyTjyqldqI/wVTBBaXqtu+CpoAxJvyVYurnWqmsMuDPxGGecbhneSnLE073XKivE1qVUrF2qan3uStZhD1yhlm00WRQxNGz5dCPXWfFsgFg7dR1/bCsVu/j2N2jH3QTwWq+aodxsvI6dfYWTO11lyP8c/lZ2LGfGx9NevQTryAEkbqZe6ud04usH7dupHEhl3RDW/k8ok8owJqhs9E8bzYXUb8MQo3t54p4Aonqyk7fLLcSGwdghiKgrckuWAXNYHeNo4sYLbuZokjlm1682S39RjDlREykV1VpNy3Nlxgx0qlZFbSj1hb7YJt0oqwUgaoAinm/870g9MbV0bE1tLjh/zrRtaeo0XXtkYsViuGdgd27kLprjlqqqihNkjP6jxpd1xyxVj3MIrX97hr1+PntcNVsGfe8GeMG/1GNUKAOZ3tLo/jkiVr1uQX6B24sPrQtB/X4iQDzjJSfmUyvmuQZ4hXW9em90SOez9uAFKlfg0O15o1SChJf2VMNbgexBdenFHg52IAL2iZzxg0frUhCshf+6qAk8YzUSd4Yr/puTGp0ggJHdUdmiSdcg21FT0sg/sc+6PjgHY0abqAnJxD3Yx+q1Om2YjaDOH4/yWRLBOSEJNBXT6cMiKCRLtLCtrOUnwDnU2bHtku/IBGuD6EP6kYFJdqQXaIL+9tFGGkr3H1TEdJMnkFk51VFD8QtKPbGU8C6UZgSuyucHv3077An2NDYl/kdv9mKPsUccnR2fMYsCy8Ue9K+TzXwERs3b/NE+rnwi605EfcDTknZ+hWzo5/7fcymWONbilsXL9g0B5R0X/iI2XJs3B/91GvQG4pTjz+9KyFyXB9Nc0n3X6y3oaLe+v6NWb9hk2oKeSJ0u776zsqEGzIi8gcbkyPXDzvNpii9sTrnw5zXKl3/tQ8o4z2ejKDztY9UnOy2H8MwDMMwDMMwDMMwzPn4DxdeXoFp70GXAAAAAElFTkSuQmCC'
				},
				{
					username: 'u3',
					fullName: 'U3FN',
					profileImageURL:
						'data:image/png;base64,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'
				},
				{
					username: 'u4',
					fullName: 'U4FN',
					profileImageURL:
						'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAQlBMVEXk5ueutLetsrXo6uvp6+ypr7OqsLSvtbfJzc/f4eKmrbDi5OXl5+fY29zU19m4vcC/w8bHy828wcO1ur7P0tTIzc4ZeVS/AAAGG0lEQVR4nO2d25ajKhCGheKgiGfz/q+6waSzZ5JOd9QiFk59F73W5Mp/ijohlEXBMAzDMAzDMAzDMAzDMAzDMAzDMAzDMAzDMAzDMP8kdVF4AFAA/uhHSUGQ5uuqaee5nOe2qeIPRz8TIkr5ZhitMHek7YY2/H70k6EAUF0m57R4QDtnhyZ/SyrVdsFkj/JuGDPNkLUhoS6Ne6HuhtN9na0dAUppfta3GFL0mdoR2t/sd3dJU2boj+C7p+Dyg8auys2Man4ZXr5FujkvK8Lw5gL9HzdmVOtAMa0WGCNOlYsZoZreCKHPSJmJRKjWueAf6DaHeAPVRnmLxIa+FaHebMGIIS/RF9MegcEZa9oR1audAoWwR2v4GRhWFDLfYzrK0UbNzu5VaHVJ2BXrvUt0gXBAhQ5FobRUFap5txNeMQNRiR7FgovE6mgt3wLDpmr0W4Uk46mv0ASGVopisFEjokLR0VOIakKSRoQeLc5EJEFPxNQX0NTCaajXcBWSy4n7e4oHpCDWReHGmYhrSRkRSnSFpicVa2DCFhjWKallWqObMDZRR6v6A2iRI2lEUuqEVW929/bPjJQUJnDDACFH9DKBCUmVNQ1Sc/83hDKib5Mo1CWZjAgX5JLtiqST85E7p7tCOh0UjCkECjGR8UPo0iiks2+aoipdOFrYnVQK5dHC7kCKfB8V1kcr++IfUHj+VZos0lCpvVNlC0EnW5w/45+/asPfaYsQ2m07f/d0/g64KJL4IaVdjEQJkUo2LJbdxAQCKe0mAva7tYi5EFJ4/l394Ij47QWdujsCl7O/XSsq9IxIKhsWCd5cWEq5IqJKZCNKaicV0MsaSgXNFcRzexFCndMd3FhD8NQX7sk9SfDkHu6RGoomjHsZaBIpeuECmkJdEUuGN85/kh3tNoKkKrDwOE0U4RslOKdM9UD5QjBCPKV5E+GOB7HTFaUg80rtBfXOZt+Qv+0M++pTl8Fd59PfdI4S3VZfzMGCEajsJomSvg9+AYXY4Iwyn6kRRcyLq1O/7ign+mfUZaUzOkqnut9CFdOaCTxTdhN4iuV1zXsarQmlaG4WXAAozTuTsGSuk7ACqh7cLyFHuzHfaWYRBfP0eiKdNFPps7XfFwDVIJyTjyqldqI/wVTBBaXqtu+CpoAxJvyVYurnWqmsMuDPxGGecbhneSnLE073XKivE1qVUrF2qan3uStZhD1yhlm00WRQxNGz5dCPXWfFsgFg7dR1/bCsVu/j2N2jH3QTwWq+aodxsvI6dfYWTO11lyP8c/lZ2LGfGx9NevQTryAEkbqZe6ud04usH7dupHEhl3RDW/k8ok8owJqhs9E8bzYXUb8MQo3t54p4Aonqyk7fLLcSGwdghiKgrckuWAXNYHeNo4sYLbuZokjlm1682S39RjDlREykV1VpNy3Nlxgx0qlZFbSj1hb7YJt0oqwUgaoAinm/870g9MbV0bE1tLjh/zrRtaeo0XXtkYsViuGdgd27kLprjlqqqihNkjP6jxpd1xyxVj3MIrX97hr1+PntcNVsGfe8GeMG/1GNUKAOZ3tLo/jkiVr1uQX6B24sPrQtB/X4iQDzjJSfmUyvmuQZ4hXW9em90SOez9uAFKlfg0O15o1SChJf2VMNbgexBdenFHg52IAL2iZzxg0frUhCshf+6qAk8YzUSd4Yr/puTGp0ggJHdUdmiSdcg21FT0sg/sc+6PjgHY0abqAnJxD3Yx+q1Om2YjaDOH4/yWRLBOSEJNBXT6cMiKCRLtLCtrOUnwDnU2bHtku/IBGuD6EP6kYFJdqQXaIL+9tFGGkr3H1TEdJMnkFk51VFD8QtKPbGU8C6UZgSuyucHv3077An2NDYl/kdv9mKPsUccnR2fMYsCy8Ue9K+TzXwERs3b/NE+rnwi605EfcDTknZ+hWzo5/7fcymWONbilsXL9g0B5R0X/iI2XJs3B/91GvQG4pTjz+9KyFyXB9Nc0n3X6y3oaLe+v6NWb9hk2oKeSJ0u776zsqEGzIi8gcbkyPXDzvNpii9sTrnw5zXKl3/tQ8o4z2ejKDztY9UnOy2H8MwDMMwDMMwDMMwzPn4DxdeXoFp70GXAAAAAElFTkSuQmCC'
				}
			],
			followers: [
				{
					username: 'u2',
					fullName: 'U2FN',
					profileImageURL:
						'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAQlBMVEXk5ueutLetsrXo6uvp6+ypr7OqsLSvtbfJzc/f4eKmrbDi5OXl5+fY29zU19m4vcC/w8bHy828wcO1ur7P0tTIzc4ZeVS/AAAGG0lEQVR4nO2d25ajKhCGheKgiGfz/q+6waSzZ5JOd9QiFk59F73W5Mp/ijohlEXBMAzDMAzDMAzDMAzDMAzDMAzDMAzDMAzDMAzDMP8kdVF4AFAA/uhHSUGQ5uuqaee5nOe2qeIPRz8TIkr5ZhitMHek7YY2/H70k6EAUF0m57R4QDtnhyZ/SyrVdsFkj/JuGDPNkLUhoS6Ne6HuhtN9na0dAUppfta3GFL0mdoR2t/sd3dJU2boj+C7p+Dyg8auys2Man4ZXr5FujkvK8Lw5gL9HzdmVOtAMa0WGCNOlYsZoZreCKHPSJmJRKjWueAf6DaHeAPVRnmLxIa+FaHebMGIIS/RF9MegcEZa9oR1audAoWwR2v4GRhWFDLfYzrK0UbNzu5VaHVJ2BXrvUt0gXBAhQ5FobRUFap5txNeMQNRiR7FgovE6mgt3wLDpmr0W4Uk46mv0ASGVopisFEjokLR0VOIakKSRoQeLc5EJEFPxNQX0NTCaajXcBWSy4n7e4oHpCDWReHGmYhrSRkRSnSFpicVa2DCFhjWKallWqObMDZRR6v6A2iRI2lEUuqEVW929/bPjJQUJnDDACFH9DKBCUmVNQ1Sc/83hDKib5Mo1CWZjAgX5JLtiqST85E7p7tCOh0UjCkECjGR8UPo0iiks2+aoipdOFrYnVQK5dHC7kCKfB8V1kcr++IfUHj+VZos0lCpvVNlC0EnW5w/45+/asPfaYsQ2m07f/d0/g64KJL4IaVdjEQJkUo2LJbdxAQCKe0mAva7tYi5EFJ4/l394Ij47QWdujsCl7O/XSsq9IxIKhsWCd5cWEq5IqJKZCNKaicV0MsaSgXNFcRzexFCndMd3FhD8NQX7sk9SfDkHu6RGoomjHsZaBIpeuECmkJdEUuGN85/kh3tNoKkKrDwOE0U4RslOKdM9UD5QjBCPKV5E+GOB7HTFaUg80rtBfXOZt+Qv+0M++pTl8Fd59PfdI4S3VZfzMGCEajsJomSvg9+AYXY4Iwyn6kRRcyLq1O/7ign+mfUZaUzOkqnut9CFdOaCTxTdhN4iuV1zXsarQmlaG4WXAAozTuTsGSuk7ACqh7cLyFHuzHfaWYRBfP0eiKdNFPps7XfFwDVIJyTjyqldqI/wVTBBaXqtu+CpoAxJvyVYurnWqmsMuDPxGGecbhneSnLE073XKivE1qVUrF2qan3uStZhD1yhlm00WRQxNGz5dCPXWfFsgFg7dR1/bCsVu/j2N2jH3QTwWq+aodxsvI6dfYWTO11lyP8c/lZ2LGfGx9NevQTryAEkbqZe6ud04usH7dupHEhl3RDW/k8ok8owJqhs9E8bzYXUb8MQo3t54p4Aonqyk7fLLcSGwdghiKgrckuWAXNYHeNo4sYLbuZokjlm1682S39RjDlREykV1VpNy3Nlxgx0qlZFbSj1hb7YJt0oqwUgaoAinm/870g9MbV0bE1tLjh/zrRtaeo0XXtkYsViuGdgd27kLprjlqqqihNkjP6jxpd1xyxVj3MIrX97hr1+PntcNVsGfe8GeMG/1GNUKAOZ3tLo/jkiVr1uQX6B24sPrQtB/X4iQDzjJSfmUyvmuQZ4hXW9em90SOez9uAFKlfg0O15o1SChJf2VMNbgexBdenFHg52IAL2iZzxg0frUhCshf+6qAk8YzUSd4Yr/puTGp0ggJHdUdmiSdcg21FT0sg/sc+6PjgHY0abqAnJxD3Yx+q1Om2YjaDOH4/yWRLBOSEJNBXT6cMiKCRLtLCtrOUnwDnU2bHtku/IBGuD6EP6kYFJdqQXaIL+9tFGGkr3H1TEdJMnkFk51VFD8QtKPbGU8C6UZgSuyucHv3077An2NDYl/kdv9mKPsUccnR2fMYsCy8Ue9K+TzXwERs3b/NE+rnwi605EfcDTknZ+hWzo5/7fcymWONbilsXL9g0B5R0X/iI2XJs3B/91GvQG4pTjz+9KyFyXB9Nc0n3X6y3oaLe+v6NWb9hk2oKeSJ0u776zsqEGzIi8gcbkyPXDzvNpii9sTrnw5zXKl3/tQ8o4z2ejKDztY9UnOy2H8MwDMMwDMMwDMMwzPn4DxdeXoFp70GXAAAAAElFTkSuQmCC'
				},
				{
					username: 'u3',
					fullName: 'U3FN',
					profileImageURL:
						'data:image/png;base64,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'
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
		await db.query(
			`
        INSERT INTO users(username,
                          password,
                          full_name,
                          email,
                          bio)
        VALUES ('u1', $1, 'U1FN', 'u1@email.com', 'test_user 1 stuff')
        RETURNING username`,
			[ await bcrypt.hash('password1', BCRYPT_WORK_FACTOR) ]
		);
		let updatedUser = await User.update('u1', updateData);
		expect(updatedUser).toEqual({
			username: 'u1',
			...updateData,
			profileImageURL:
				'data:image/png;base64,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',
			bio: 'test_user 1 stuff'
		});
	});

	test('works: set password', async function() {
		await db.query(
			`
			INSERT INTO users(username,
				password,
				full_name,
				email,
				bio)
				VALUES ('u1', $1, 'U1FN', 'u1@email.com', 'test_user 1 stuff')
				RETURNING username`,
			[ await bcrypt.hash('password1', BCRYPT_WORK_FACTOR) ]
		);
		let updatedUser = await User.update('u1', {
			password: 'new'
		});
		expect(updatedUser).toEqual({
			username: 'u1',
			fullName: 'U1FN',
			email: 'u1@email.com',
			profileImageURL:
				'data:image/png;base64,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',
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
		await db.query(
			`
			INSERT INTO users(username,
				password,
				full_name,
				email,
				bio)
				VALUES ('u1', $1, 'U1FN', 'u1@email.com', 'test_user 1 stuff')
				RETURNING username`,
			[ await bcrypt.hash('password1', BCRYPT_WORK_FACTOR) ]
		);
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

/************************************** follow and unfollowing */

describe('follow', function() {
	test('works for following and unfollowing', async function() {
		await db.query(
			`
        INSERT INTO users(username,
                          password,
                          full_name,
                          email,
                          bio)
        VALUES ('u1', $1, 'U1FN', 'u1@email.com', 'test_user 1 stuff'),
               ('u2', $2, 'U2FN', 'u2@email.com', 'test_user 2 stuff'),
               ('u3', $3, 'U3FN', 'u3@email.com', 'test_user 3 stuff')
        RETURNING username`,
			[
				await bcrypt.hash('password1', BCRYPT_WORK_FACTOR),
				await bcrypt.hash('password2', BCRYPT_WORK_FACTOR),
				await bcrypt.hash('password3', BCRYPT_WORK_FACTOR)
			]
		);

		// u1 will be following everyone
		// only u2 and u3 will be following u1 back
		await db.query(
			`
	    INSERT INTO follows(username_being_followed, username_following)
	    VALUES ('u2', 'u1'), ('u3', 'u1'), ('u1', 'u2'), ('u1', 'u3')`
		);
		await User.follow('u2', 'u3');

		const res1 = await db.query(`SELECT * FROM follows WHERE username_following='u2'`);
		expect(res1.rows).toEqual([
			{
				username_being_followed: 'u1',
				username_following: 'u2'
			},
			{
				username_being_followed: 'u3',
				username_following: 'u2'
			}
		]);

		await User.unfollow('u2', 'u3');

		const res2 = await db.query(`SELECT * FROM follows WHERE username_following='u2'`);
		expect(res2.rows).toEqual([
			{
				username_being_followed: 'u1',
				username_following: 'u2'
			}
		]);
	});

	test('not found if no such user', async function() {
		await db.query(
			`
        INSERT INTO users(username,
                          password,
                          full_name,
                          email,
                          bio)
        VALUES ('u1', $1, 'U1FN', 'u1@email.com', 'test_user 1 stuff')
        RETURNING username`,
			[ await bcrypt.hash('password1', BCRYPT_WORK_FACTOR) ]
		);
		try {
			await User.follow('u1', 'u5');
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	test('not found if no such user', async function() {
		await db.query(
			`
        INSERT INTO users(username,
                          password,
                          full_name,
                          email,
                          bio)
        VALUES ('u1', $1, 'U1FN', 'u1@email.com', 'test_user 1 stuff')
        RETURNING username`,
			[ await bcrypt.hash('password1', BCRYPT_WORK_FACTOR) ]
		);
		try {
			await User.follow('nope', 'u1');
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

/************************************** unfollow nonexistent users */

describe('unfollow', function() {
	test('not found if no such user', async function() {
		await db.query(
			`
        INSERT INTO users(username,
                          password,
                          full_name,
                          email,
                          bio)
        VALUES ('u1', $1, 'U1FN', 'u1@email.com', 'test_user 1 stuff')
        RETURNING username`,
			[ await bcrypt.hash('password1', BCRYPT_WORK_FACTOR) ]
		);
		try {
			await User.unfollow('u1', 'u5');
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	test('not found if no such user', async function() {
		await db.query(
			`
        INSERT INTO users(username,
                          password,
                          full_name,
                          email,
                          bio)
        VALUES ('u1', $1, 'U1FN', 'u1@email.com', 'test_user 1 stuff')
        RETURNING username`,
			[ await bcrypt.hash('password1', BCRYPT_WORK_FACTOR) ]
		);
		try {
			await User.unfollow('nope', 'u1');
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

/************************************** createPost */

describe('creating a post', function() {
	test('works', async function() {
		await db.query(
			`
        INSERT INTO users(username,
                          password,
                          full_name,
                          email,
                          bio)
        VALUES ('u4', $1, 'U4FN', 'u4@email.com', 'test_user 4 stuff')
        RETURNING username`,
			[ await bcrypt.hash('password4', BCRYPT_WORK_FACTOR) ]
		);
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

/************************************** like and unlike */

describe('liking and unliking', function() {
	test('works for liking and unliking a comment', async function() {
		const testPostsPostIds = [];
		const testCommentIds = [];
		await db.query(
			`
        INSERT INTO users(username,
                          password,
                          full_name,
                          email,
                          bio)
        VALUES ('u1', $1, 'U1FN', 'u1@email.com', 'test_user 1 stuff'),
               ('u2', $2, 'U2FN', 'u2@email.com', 'test_user 2 stuff')
        RETURNING username`,
			[ await bcrypt.hash('password1', BCRYPT_WORK_FACTOR), await bcrypt.hash('password2', BCRYPT_WORK_FACTOR) ]
		);

		const resultsPosts = await db.query(
			`
		INSERT INTO posts(username, post_url, caption)
		VALUES ('u1', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc14uK4IYYBB8TU2JnCEmxKMeGEbfw_flCuQ&usqp=CAU', 'a fake post by u1')
		RETURNING created_at, post_id`
		);
		testPostsPostIds.splice(0, 0, ...resultsPosts.rows.map((r) => r.post_id));

		// u2 will make a comment on u1's post and u1 will like it, and u2 will comment on their own post
		const resultsComments = await db.query(
			`
		INSERT INTO comments(message, username, post_id)
		VALUES ('nice post, u1!', 'u2', $1)
		RETURNING created_at, comment_id`,
			[ testPostsPostIds[0] ]
		);
		testCommentIds.splice(0, 0, ...resultsComments.rows.map((r) => r.comment_id));
		await User.like('u1', testCommentIds[0], 'comment');

		const res1 = await db.query(
			`SELECT username, comment_id AS "commentId" FROM comment_likes WHERE username='u1'`
		);
		expect(res1.rows.length).toEqual(1);
		expect(res1.rows[0]).toEqual({
			username: 'u1',
			commentId: testCommentIds[0]
		});

		await User.unlike('u1', testCommentIds[0], 'comment');

		const res2 = await db.query(
			`SELECT username, comment_id AS "commentId" FROM comment_likes WHERE username='u1'`
		);
		expect(res2.rows.length).toEqual(0);
		expect(res2.rows[0]).toEqual();
	});

	test('works for liking and unliking a post', async function() {
		const testPostsPostIds = [];
		await db.query(
			`
        INSERT INTO users(username,
                          password,
                          full_name,
                          email,
                          bio)
        VALUES ('u1', $1, 'U1FN', 'u1@email.com', 'test_user 1 stuff'),
               ('u2', $2, 'U2FN', 'u2@email.com', 'test_user 2 stuff')
        RETURNING username`,
			[ await bcrypt.hash('password1', BCRYPT_WORK_FACTOR), await bcrypt.hash('password2', BCRYPT_WORK_FACTOR) ]
		);

		const resultsPosts = await db.query(
			`
		INSERT INTO posts(username, post_url, caption)
		VALUES ('u2', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc14uK4IYYBB8TU2JnCEmxKMeGEbfw_flCuQ&usqp=CAU', 'a fake post by u2')
		RETURNING created_at, post_id`
		);
		testPostsPostIds.splice(0, 0, ...resultsPosts.rows.map((r) => r.post_id));
		await User.like('u1', testPostsPostIds[0], 'post');

		const res1 = await db.query(`SELECT username, post_id AS "postId" FROM post_likes WHERE post_id=$1`, [
			testPostsPostIds[0]
		]);
		expect(res1.rows.length).toEqual(1);
		expect(res1.rows[0]).toEqual({
			username: 'u1',
			postId: testPostsPostIds[0]
		});

		await User.unlike('u1', testPostsPostIds[0], 'post');

		const res2 = await db.query(`SELECT username, post_id AS "postId" FROM post_likes WHERE post_id=$1`, [
			testPostsPostIds[0]
		]);
		expect(res2.rows.length).toEqual(0);
		expect(res2.rows[0]).toEqual();
	});
});

/************************************** comment */

describe('commenting', function() {
	test('works for commenting on a post', async function() {
		const testPostsPostIds = [];
		await db.query(
			`
        INSERT INTO users(username,
                          password,
                          full_name,
                          email,
                          bio)
        VALUES ('u1', $1, 'U1FN', 'u1@email.com', 'test_user 1 stuff'),
               ('u2', $2, 'U2FN', 'u2@email.com', 'test_user 2 stuff')
        RETURNING username`,
			[ await bcrypt.hash('password1', BCRYPT_WORK_FACTOR), await bcrypt.hash('password2', BCRYPT_WORK_FACTOR) ]
		);

		const resultsPosts = await db.query(
			`
		INSERT INTO posts(username, post_url, caption)
		VALUES ('u2', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc14uK4IYYBB8TU2JnCEmxKMeGEbfw_flCuQ&usqp=CAU', 'a fake post by u2')
		RETURNING created_at, post_id`
		);
		testPostsPostIds.splice(0, 0, ...resultsPosts.rows.map((r) => r.post_id));
		const newComment = {
			username: 'u1',
			postId: testPostsPostIds[0],
			parentId: null,
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
		const testPostsPostIds = [];
		await db.query(
			`
        INSERT INTO users(username,
                          password,
                          full_name,
                          email,
                          bio)
        VALUES ('u1', $1, 'U1FN', 'u1@email.com', 'test_user 1 stuff'),
               ('u2', $2, 'U2FN', 'u2@email.com', 'test_user 2 stuff')
        RETURNING username`,
			[ await bcrypt.hash('password1', BCRYPT_WORK_FACTOR), await bcrypt.hash('password2', BCRYPT_WORK_FACTOR) ]
		);

		const resultsPosts = await db.query(
			`
		INSERT INTO posts(username, post_url, caption)
		VALUES ('u2', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc14uK4IYYBB8TU2JnCEmxKMeGEbfw_flCuQ&usqp=CAU', 'a fake post by u2')
		RETURNING created_at, post_id`
		);
		testPostsPostIds.splice(0, 0, ...resultsPosts.rows.map((r) => r.post_id));
		const newComment1 = {
			username: 'u1',
			postId: testPostsPostIds[0],
			parentId: null,
			message: 'nice post, u2!'
		};
		const comment1 = await User.comment({ ...newComment1 });
		const newComment2 = {
			username: 'u2',
			postId: testPostsPostIds[0],
			parentId: comment1.commentId,
			message: 'thank you, u1!'
		};
		const comment2 = await User.comment({ ...newComment2 });
		const res = await db.query(
			`SELECT comment_id AS "commentId", parent_id AS "parentId", message, created_at AS "createdAt", username, post_id AS "postId" FROM comments WHERE message='thank you, u1!'`
		);
		expect(res.rows.length).toEqual(1);
		expect(res.rows[0]).toEqual(comment2);
	});
});

/************************************** getUserComments */

describe('getting all of specific user comments', function() {
	test('works for comments with likes', async function() {
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
		const testPostsPostIds = [];
		const resultsPosts = await db.query(
			`
		INSERT INTO posts(username, post_url, caption)
		VALUES ('u1', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc14uK4IYYBB8TU2JnCEmxKMeGEbfw_flCuQ&usqp=CAU', 'a fake post by u1'),
		('u2', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc14uK4IYYBB8TU2JnCEmxKMeGEbfw_flCuQ&usqp=CAU', 'a fake post by u2')
		RETURNING post_id`
		);
		testPostsPostIds.splice(0, 0, ...resultsPosts.rows.map((r) => r.post_id));
		const newComment1 = {
			username: 'u2',
			postId: testPostsPostIds[0],
			parentId: null,
			message: 'nice post, u1!'
		};
		const comment1 = await User.comment({ ...newComment1 });
		const newComment2 = {
			username: 'u2',
			postId: testPostsPostIds[1],
			parentId: comment1.commentId,
			message: 'here are some hashtags I forgot!'
		};
		const comment2 = await User.comment({ ...newComment2 });
		await User.like('u1', comment1.commentId, { type: 'comment' });
		await User.like('u1', comment2.commentId, { type: 'comment' });
		await User.like('u3', comment1.commentId, { type: 'comment' });
		await User.like('u3', comment2.commentId, { type: 'comment' });
		await User.like('u4', comment2.commentId, { type: 'comment' });
		let user = await User.getUserComments('u2');
		expect(user).toEqual({
			username: 'u2',
			comments: [
				{
					commentId: comment1.commentId,
					parentId: null,
					message: 'nice post, u1!',
					createdAt: comment1.createdAt,
					postId: testPostsPostIds[0],
					likes: '2'
				},
				{
					commentId: comment2.commentId,
					parentId: comment1.commentId,
					message: 'here are some hashtags I forgot!',
					createdAt: comment2.createdAt,
					postId: testPostsPostIds[1],
					likes: '3'
				}
			]
		});
	});

	// test('works for comments without likes', async function() {
	// 	await db.query(
	// 		`
	//     INSERT INTO users(username,
	//                       password,
	//                       full_name,
	//                       email,
	//                       bio)
	//     VALUES ('u1', $1, 'U1FN', 'u1@email.com', 'test_user 1 stuff'),
	//            ('u2', $2, 'U2FN', 'u2@email.com', 'test_user 2 stuff')
	//     RETURNING username`,
	// 		[ await bcrypt.hash('password1', BCRYPT_WORK_FACTOR), await bcrypt.hash('password2', BCRYPT_WORK_FACTOR) ]
	// 	);
	// 	const testPostsPostIds = [];
	// 	const resultsPosts = await db.query(
	// 		`
	// 	INSERT INTO posts(username, post_url, caption)
	// 	VALUES ('u1', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc14uK4IYYBB8TU2JnCEmxKMeGEbfw_flCuQ&usqp=CAU', 'a fake post by u1')
	// 	RETURNING post_id`
	// 	);
	// 	testPostsPostIds.splice(0, 0, ...resultsPosts.rows.map((r) => r.post_id));
	// 	const newComment = {
	// 		username: 'u2',
	// 		postId: testPostsPostIds[0],
	// 		parentId: null,
	// 		message: 'wow, u1, what a great post!'
	// 	};
	// 	const comment = await User.comment({ ...newComment });
	// 	const userU2Comment = await User.getUserComments('u2');
	// 	expect(userU2Comment).toEqual({
	// 		username: 'u2',
	// 		comments: [ comment ]
	// 	});
	// });
});

/************************************** getPostComments */

describe("getting a post's comments and show children", function() {
	test('works for a post', async function() {
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
		const newPost = {
			postURL: 'https://fake-url.com',
			caption: 'a new post by me, u1',
			watermark: null,
			watermarkFont: null,
			filter: null,
			username: 'u1'
		};
		const post = await User.createPost({ ...newPost });

		const newComment1 = {
			username: 'u2',
			postId: post.postId,
			parentId: null,
			message: 'another nice post, u1!'
		};
		const comment1 = await User.comment({ ...newComment1 });

		const newComment2 = {
			username: 'u3',
			postId: post.postId,
			parentId: null,
			message: 'yeah, u1, what a great post!'
		};
		const comment2 = await User.comment({ ...newComment2 });

		const newComment3 = {
			username: 'u1',
			postId: post.postId,
			parentId: comment2.commentId,
			message: 'child of comment2'
		};
		const comment3 = await User.comment({ ...newComment3 });

		const newComment4 = {
			username: 'u2',
			postId: post.postId,
			parentId: comment2.commentId,
			message: 'child of comment2 also'
		};
		const comment4 = await User.comment({ ...newComment4 });

		const newComment5 = {
			username: 'u3',
			postId: post.postId,
			parentId: comment3.commentId,
			message: 'child of comment3'
		};
		const comment5 = await User.comment({ ...newComment5 });

		const postComments = await User.getPostComments(post.postId);

		expect(postComments).toEqual([
			{
				commentId: comment1.commentId,
				parentId: null,
				message: 'another nice post, u1!',
				username: 'u2',
				numLikes: '0',
				createdAt: comment1.createdAt,
				children: []
			},
			{
				commentId: comment2.commentId,
				parentId: null,
				message: 'yeah, u1, what a great post!',
				username: 'u3',
				numLikes: '0',
				createdAt: comment2.createdAt,
				children: [
					{
						comment_id: comment3.commentId,
						parent_id: comment2.commentId,
						message: 'child of comment2',
						username: 'u1',
						numLikes: '0',
						created_at: comment3.createdAt
					},
					{
						comment_id: comment4.commentId,
						parent_id: comment2.commentId,
						message: 'child of comment2 also',
						username: 'u2',
						numLikes: '0',
						created_at: comment4.createdAt
					},
					{
						comment_id: comment5.commentId,
						parent_id: comment3.commentId,
						message: 'child of comment3',
						username: 'u3',
						numLikes: '0',
						created_at: comment5.createdAt
					}
				]
			}
		]);
	});
});

/************************************** getAllUserFollowerPosts */

describe("getting all of a user's followers' posts", function() {
	test('works for a post', async function() {
		await db.query(
			`
        INSERT INTO users(username,
                          password,
                          full_name,
                          email,
                          bio)
        VALUES ('u1', $1, 'U1FN', 'u1@email.com', 'test_user 1 stuff'),
               ('u2', $2, 'U2FN', 'u2@email.com', 'test_user 2 stuff'),
               ('u3', $3, 'U3FN', 'u3@email.com', 'test_user 3 stuff')
        RETURNING username`,
			[
				await bcrypt.hash('password1', BCRYPT_WORK_FACTOR),
				await bcrypt.hash('password2', BCRYPT_WORK_FACTOR),
				await bcrypt.hash('password3', BCRYPT_WORK_FACTOR)
			]
		);
		const newPost1 = {
			postURL: 'https://fake-url.com',
			caption: 'a new post by me, u2',
			watermark: null,
			watermarkFont: null,
			filter: null,
			username: 'u2'
		};
		const post1 = await User.createPost({ ...newPost1 });
		const newPost2 = {
			postURL: 'https://fake-url.com',
			caption: 'a new post by me, u3',
			watermark: null,
			watermarkFont: null,
			filter: null,
			username: 'u3'
		};
		const post2 = await User.createPost({ ...newPost2 });
		const newPost3 = {
			postURL: 'https://fake-url.com',
			caption: 'another new post by me, u3',
			watermark: null,
			watermarkFont: null,
			filter: null,
			username: 'u3'
		};
		const post3 = await User.createPost({ ...newPost3 });
		await User.follow('u1', 'u2');
		await User.follow('u1', 'u3');
		const followingPosts = await User.getAllUserFollowerPosts('u1');
		expect(followingPosts).toEqual([
			{
				username: 'u2',
				profileImageURL:
					'data:image/png;base64,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',
				postId: post1.postId,
				postURL: post1.postURL,
				caption: post1.caption,
				createdAt: post1.createdAt,
				numLikes: '0'
			},
			{
				username: 'u3',
				profileImageURL:
					'data:image/png;base64,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',
				postId: post2.postId,
				postURL: post2.postURL,
				caption: post2.caption,
				createdAt: post2.createdAt,
				numLikes: '0'
			},
			{
				username: 'u3',
				profileImageURL:
					'data:image/png;base64,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',
				postId: post3.postId,
				postURL: post3.postURL,
				caption: post3.caption,
				createdAt: post3.createdAt,
				numLikes: '0'
			}
		]);
	});
});
