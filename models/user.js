'use strict';

const db = require('../db');
const bcrypt = require('bcrypt');
const { sqlForPartialUpdate } = require('../helpers/sql');
const { NotFoundError, BadRequestError, UnauthorizedError } = require('../expressError');

const { BCRYPT_WORK_FACTOR } = require('../config.js');

/** Related functions for users. */

class User {
	/** authenticate user with username, password.
   *
   * Returns { username, first_name, last_name, email, profile_image_url, bio}
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/

	static async authenticate(username, password) {
		// try to find the user first
		const result = await db.query(
			`SELECT username,
                  password,
                  full_name AS "fullName",
                  email,
                  profile_image_url AS "profileImageURL",
                  bio
           FROM users
           WHERE username = $1`,
			[ username ]
		);

		const user = result.rows[0];

		if (user) {
			// compare hashed password to a new hash from password
			const isValid = await bcrypt.compare(password, user.password);
			if (isValid === true) {
				delete user.password;
				return user;
			}
		}

		throw new UnauthorizedError('Invalid username/password');
	}

	/** Register user with data.
   *
   * Returns { username, fullName, email, profileImageURL, bio}
   *
   * Throws BadRequestError on duplicates.
   **/

	static async register({ username, password, fullName, email, profileImageURL, bio }) {
		const duplicateCheck = await db.query(
			`SELECT username
           FROM users
           WHERE username = $1`,
			[ username ]
		);

		if (duplicateCheck.rows[0]) {
			throw new BadRequestError(`Duplicate username: ${username}`);
		}

		const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

		const result = await db.query(
			`INSERT INTO users
           (username,
            password,
            full_name,
            email,
            profile_image_url,
            bio)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING username, full_name AS "fullName", email, profile_image_url AS "profileImageURL", bio`,
			[ username, hashedPassword, fullName, email, profileImageURL, bio ]
		);

		const user = result.rows[0];

		return user;
	}

	/** Find all users (optional filter on searchFilter).
   *
   * searchFilter (optional):
   * - username (will find case-insensitive, partial matches)
   * - fullName (will find case-insensitive, partial matches)
   * 
   * Returns [{ username, fullName, profileImageURL }, ...]
   **/

	static async findAll(searchFilter = {}) {
		let query = `SELECT username,
                            full_name AS "fullName",
                            profile_image_url AS "profileImageURL",
                            bio
                     FROM users`;

		const { name } = searchFilter;

		// This can search users by username or fullname.
		if (name) {
			query += ` WHERE username ILIKE '%${name}%' OR full_name ILIKE '%${name}%'`;
		}

		// Finalize query and return results
		query += ' ORDER BY username';
		const usersRes = await db.query(query);
		return usersRes.rows;
	}

	/** Given a username, return data about user.
   *
   * Returns { username, fullName, email, profileImageURL, bio, posts, postLikes }
   *   where posts is [{ postId, postURL, caption, watermark, filter, createdAt }, ...]
   *   where postLikes is [{ postId, username, postURL, caption, watermark, filter, createdAt }, ...]
   *   where following is [{username, fullName, profileImageURL}, ...]
   *   where followers is [{username, fullName, profileImageURL}, ...]
   *   TODO: where comments are [{...}, ...]
   * 
   * Throws NotFoundError if user not found.
   **/

	static async get(username) {
		const userRes = await db.query(
			`SELECT username,
                  full_name AS "fullName",
                  email,
                  profile_image_url AS "profileImageURL",
                  bio
           FROM users
           WHERE username = $1`,
			[ username ]
		);

		const user = userRes.rows[0];

		if (!user) throw new NotFoundError(`No user: ${username}`);

		const postsRes = await db.query(
			`SELECT post_id AS "postId", 
                post_url AS "postURL", 
                caption, watermark, filter, 
                created_at AS "createdAt"
            FROM posts
            WHERE username = $1
            ORDER BY created_at`,
			[ username ]
		);

		user.posts = postsRes.rows;

		const postLikesRes = await db.query(
			`SELECT 
			posts.post_id AS "postId",
			posts.username, 
            post_url AS "postURL",
            caption,
            watermark,
            filter,
            created_at AS "createdAt"
            FROM posts 
            JOIN post_likes
            ON posts.post_id = post_likes.post_id 
            WHERE post_likes.username = $1`,
			[ username ]
		);

		user.postLikes = postLikesRes.rows;

		const followingRes = await db.query(
			`SELECT username,
			full_name AS "fullName",
			profile_image_url AS "profileImageURL"
			FROM users
			JOIN follows 
			ON users.username = follows.username_being_followed 
			WHERE follows.username_following = $1`,
			[ username ]
		);

		user.following = followingRes.rows;

		const followersRes = await db.query(
			`SELECT username,
			full_name AS "fullName",
			profile_image_url AS "profileImageURL"
			FROM users
			JOIN follows 
			ON users.username = follows.username_following 
			WHERE follows.username_being_followed = $1`,
			[ username ]
		);

		user.followers = followersRes.rows;

		return user;
	}

	/** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { fullName, password, email, profileImageURL, bio }
   *
   * Returns { username, fullName, email, profileImageURL, bio  }
   *
   * Throws NotFoundError if not found.
   *
   * WARNING: this function can set a new password.
   * Callers of this function must be certain they have validated inputs to this
   * or a serious security risks are opened.
   */

	static async update(username, data) {
		if (data.password) {
			data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
		}

		const { setCols, values } = sqlForPartialUpdate(data, {
			fullName: 'full_name',
			email: 'email',
			profileImageURL: 'profile_image_url',
			bio: 'bio'
		});
		const usernameVarIdx = '$' + (values.length + 1);

		const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                full_name AS "fullName",
                                email,
                                profile_image_url AS "profileImageURL",
                                bio`;
		const result = await db.query(querySql, [ ...values, username ]);
		const user = result.rows[0];

		if (!user) throw new NotFoundError(`No user: ${username}`);

		delete user.password;
		return user;
	}

	/** Delete given user from database; returns undefined. */

	static async remove(username) {
		let result = await db.query(
			`DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
			[ username ]
		);
		const user = result.rows[0];

		if (!user) throw new NotFoundError(`No user: ${username}`);
	}

	/** Follow another user: update db, returns undefined.
   *
   * - username_following: username following another username
   * - username_being_followed: username that is getting followed
   **/

	static async follow(username_following, username_being_followed) {
		const preCheck = await db.query(
			`SELECT username
           FROM users
           WHERE username = $1`,
			[ username_being_followed ]
		);
		const user_to_be_followed = preCheck.rows[0];

		if (!user_to_be_followed) throw new NotFoundError(`No username: ${username_being_followed}`);

		const preCheck2 = await db.query(
			`SELECT username
           FROM users
           WHERE username = $1`,
			[ username_following ]
		);
		const user_following = preCheck2.rows[0];

		if (!user_following) throw new NotFoundError(`No username: ${username_following}`);

		await db.query(
			`INSERT INTO follows (username_being_followed, username_following)
           VALUES ($1, $2)`,
			[ username_being_followed, username_following ]
		);
	}

	/** Create a post as a user: insert into posts table, returns new post.
	*	
	*  Returns {postId, postURL, caption, watermark, filter, createdAt, username}
	**/

	static async createPost({ username, postURL, caption, watermark, watermarkFont, filter }) {
		const userRes = await db.query(
			`SELECT username,
                  full_name AS "fullName",
                  email,
                  profile_image_url AS "profileImageURL",
                  bio
           FROM users
           WHERE username = $1`,
			[ username ]
		);

		const user = userRes.rows[0];

		if (!user) throw new NotFoundError(`No user: ${username}`);

		const result = await db.query(
			`INSERT INTO posts
			(post_url,
			caption,
			watermark,
			watermark_font,
			filter,
			username)
			VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING post_id AS "postId", post_url AS "postURL", caption, watermark, watermark_font AS "watermarkFont", filter, created_at AS "createdAt", username`,
			[ postURL, caption, watermark, watermarkFont, filter, username ]
		);

		const post = result.rows[0];
		return post;
	}

	/** Like a comment or a post.
	* 
	* Specify if comment or post through likeType={}
	* 
	* Returns undefined
	**/

	static async like(username, commentOrPostId, likeType = {}) {
		const userRes = await db.query(
			`SELECT username,
                  full_name AS "fullName",
                  email,
                  profile_image_url AS "profileImageURL",
                  bio
           FROM users
           WHERE username = $1`,
			[ username ]
		);

		const user = userRes.rows[0];

		if (!user) throw new NotFoundError(`No user: ${username}`);

		const { type } = likeType;

		type === 'post'
			? await db.query(
					`INSERT INTO post_likes
			   (username,
			   post_id)
			   VALUES ($1, $2)`,
					[ username, commentOrPostId ]
				)
			: await db.query(
					`INSERT INTO comment_likes
			   (username,
			   comment_id)
			   VALUES ($1, $2)`,
					[ username, commentOrPostId ]
				);
	}

	/** Make a comment on a post or another comment.
	* 
	* Returns comment
	**/

	static async comment({ username, postId, parentId, message }) {
		const result = await db.query(
			`INSERT INTO comments
			(parent_id,
				message,
				username,
				post_id)
			VALUES ($1, $2, $3, $4)
			RETURNING comment_id AS "commentId", parent_id AS "parentId", message, created_at AS "createdAt", username, post_id AS "postId"`,
			[ parentId, message, username, postId ]
		);

		const comment = result.rows[0];
		return comment;
	}
}

// TODO: need to see all users comments through get(username)
// TODO: we still need user to make comments on posts AND comments.
// ALSO: users need to be able to see all their followers and their posts.
// ALSO: user needs to be able to see any of their comments and likes
// ALSO: user needs to be able to delete a post or comment.
// ALSO: user needs to be able to edit a post, comment, and unlike a post or comment.
// Should we be able to update username and ON UPDATE CASCADE everywhere? New test for update?
// Should every method check if username exists? Create a helper function?
module.exports = User;
