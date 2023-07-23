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

	static async register({ username, password, fullName, email, bio }) {
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
            bio)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING username, full_name AS "fullName", email, profile_image_url AS "profileImageURL", bio`,
			[ username, hashedPassword, fullName, email, bio ]
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
   * Returns { username, fullName, email, profileImageURL, bio, posts, postLikes, commentLikes, following, followers }
   *   where posts are [{ postId, postURL, caption, watermark, filter, createdAt }, ...]
   *   where postLikes are [{ postId, username, postURL, caption, watermark, filter, createdAt }, ...]
   *   where commentLikes are [{ commentId, username, message, createdAt, postId }, ...]
   *   where following is [{username, fullName, profileImageURL}, ...]
   *   where followers are [{username, fullName, profileImageURL}, ...]
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
				post_key AS "postKey",
                caption, watermark, filter, 
                created_at AS "createdAt"
            FROM posts
            WHERE username = $1
            ORDER BY created_at`,
			[ username ]
		);

		// user.posts = postsRes.rows;
		for (let post of postsRes.rows) {
			const postLikesRes = await db.query(
				`SELECT COUNT(*)
			FROM post_likes
			WHERE post_id = $1`,
				[ post.postId ]
			);

			const postCommentsRes = await db.query(
				`SELECT COUNT(*)
			FROM comments
			WHERE post_id = $1`,
				[ post.postId ]
			);

			post.numLikes = postLikesRes.rows[0].count;

			post.numComments = postCommentsRes.rows[0].count;
		}

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

		const commentLikesRes = await db.query(
			`SELECT
			c.comment_id AS "commentId",
			c.username,
		    message,
		    created_at AS "createdAt",
			post_id AS "postId"
		    FROM comments c
		    JOIN comment_likes cl
		    ON c.comment_id = cl.comment_id
		    WHERE cl.username = $1`,
			[ username ]
		);

		user.commentLikes = commentLikesRes.rows;

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
   * or serious security risks are opened.
   */

	static async update(username, data) {
		if (data.password) {
			data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
		}

		const { setCols, values } = sqlForPartialUpdate(data, {
			profileImageURL: 'profile_image_url',
			fullName: 'full_name',
			username: 'username',
			bio: 'bio',
			email: 'email'
		});
		const usernameVarIdx = '$' + (values.length + 1);

		const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
					  			profile_image_url AS "profileImageURL",
                                full_name AS "fullName",
                                bio,
                                email`;
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

	/** Unfollow another user: update db, returns undefined.
   *
   * - username_unfollowing: username unfollowing another username
   * - username_being_unfollowed: username that is getting unfollowed
   **/

	static async unfollow(username_unfollowing, username_being_unfollowed) {
		const preCheck = await db.query(
			`SELECT username
           FROM users
           WHERE username = $1`,
			[ username_being_unfollowed ]
		);
		const user_to_be_unfollowed = preCheck.rows[0];

		if (!user_to_be_unfollowed) throw new NotFoundError(`No username: ${username_being_unfollowed}`);

		const preCheck2 = await db.query(
			`SELECT username
           FROM users
           WHERE username = $1`,
			[ username_unfollowing ]
		);
		const user_unfollowing = preCheck2.rows[0];

		if (!user_unfollowing) throw new NotFoundError(`No username: ${username_unfollowing}`);

		await db.query(
			`DELETE FROM follows 
			WHERE username_being_followed = $1
			AND username_following = $2`,
			[ username_being_unfollowed, username_unfollowing ]
		);
	}

	/** Create a post as a user: insert into posts table, returns new post.
	*	
	*  Returns {postId, postURL, caption, watermark, filter, createdAt, username}
	**/

	static async createPost({ username, postURL, postKey, caption, watermark, watermarkFont, filter }) {
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
			(username,
			caption,
			watermark,
			watermark_font,
			filter,
			post_url,
			post_key
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING post_id AS "postId", post_url AS "postURL", caption, watermark, watermark_font AS "watermarkFont", filter, created_at AS "createdAt", username, post_key AS "postKey"`,
			[ username, caption, watermark, watermarkFont, filter, postURL, postKey ]
		);

		const post = result.rows[0];
		return post;
	}

	/** Delete a post by the user: delete from posts table, returns "postDeletion: success".
	*	
	**/

	static async deletePost({ postId }) {
		const postRes = await db.query(
			`SELECT * 
			FROM posts
			WHERE post_id = $1`,
			[ postId ]
		);

		if (!postRes.rows[0]) throw new NotFoundError(`No post: ${postId}`);

		const result = await db.query(
			`DELETE FROM posts
			WHERE post_id = $1`,
			[ postId ]
		);

		return result.rows[0];
	}

	/** Like a comment or a post.
	* 
	* Specify if comment or post through likeType={}
	* 
	* Returns undefined
	**/

	static async like(username, commentOrPostId, likeType) {
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

		likeType === 'post'
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

	/** Unlike a comment or a post.
	* 
	* Specify if comment or post through likeType
	* 
	* Returns undefined
	**/

	static async unlike(username, commentOrPostId, likeType) {
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

		likeType === 'post'
			? await db.query(
					`DELETE FROM post_likes
			    WHERE username = $1
			    AND post_id = $2`,
					[ username, commentOrPostId ]
				)
			: await db.query(
					`DELETE FROM comment_likes
			    WHERE username = $1
			    AND comment_id = $2`,
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
			RETURNING comment_id AS "commentId", 
			parent_id AS "parentId", 
			message, 
			created_at AS "createdAt", 
			username,
			post_id AS "postId"`,
			[ parentId, message, username, postId ]
		);

		const comment = result.rows[0];
		return comment;
	}

	/** Get user's comments.
	* 
	* Should look like this: {username, comments},
	* where comments are [{commentId, parentId, message, createdAt, postId, likes}, ...]
	* 
	* Returns comment
	**/

	static async getUserComments(username) {
		let userComments = { username: username };
		const result = await db.query(
			`SELECT c.comment_id AS "commentId",
			c.parent_id AS "parentId",
			c.message,
			c.created_at AS "createdAt",
			c.post_id AS "postId",
			SUM(CASE WHEN c.comment_id = l.comment_id THEN 1 ELSE 0 END) AS "likes"
			FROM comments c
			JOIN comment_likes l 
			ON c.comment_id = l.comment_id
			WHERE c.username=$1
			GROUP BY c.comment_id;`,
			[ username ]
		);

		userComments.comments = result.rows;
		return userComments;
	}

	/** Get a specific post's details.
	* 
	* Should look like this: {postId, postURL, caption, watermark, watermarkFont, filter, createdAt, username, postLikes, comments},
	* 	where postLikes are [{username}, ...]
	* 	where comments are [{commentId, parentId, message, createdAt, likes}, ...]
	*	
	* Returns post
	**/

	static async getPost(postId) {
		const postRes = await db.query(
			`SELECT post_id AS "postId",
            post_url AS "postURL",
			post_key AS "postKey",
            caption,
            watermark,
            watermark_font AS "watermarkFont",
			filter,
			created_at AS "createdAt",
            username
           	FROM posts
           	WHERE post_id = $1`,
			[ postId ]
		);

		const post = postRes.rows[0];

		if (!post) throw new NotFoundError(`No post: ${postId}`);

		const postLikesRes = await db.query(
			`SELECT COUNT(*) as "likes"
			FROM post_likes
			WHERE post_id = $1`,
			[ postId ]
		);

		post.postLikes = postLikesRes.rows[0];

		const commentsRes = await db.query(
			`SELECT c.comment_id AS "commentId",
			c.parent_id AS "parentId", 
			c.message, 
			c.created_at AS "createdAt",
			SUM(CASE WHEN c.comment_id = l.comment_id THEN 1 ELSE 0 END) AS "likes" 
			FROM comments c
			JOIN posts p
			ON c.post_id = p.post_id
			JOIN comment_likes l
			ON c.comment_id = l.comment_id
			WHERE p.post_id = $1
			GROUP BY c.comment_id, p.post_id`,
			[ postId ]
		);

		post.comments = commentsRes.rows;

		return post;
	}

	/* 
	*	for a single post, get each of its first level child comments (all comments that have parent id of null) 
	*	for each first level comment, get its children comments and their children comments. 
	*
	*	get first level children of post with postId. 
	*	For each of the first level children, find their children.
	*	return an object with postId, comments: [{comment, children: [{...}]}, ...]
	*	
	*/

	static async getPostComments(postId) {
		const postRes = await db.query(
			`SELECT post_url AS "postURL",
					caption,
					created_at AS "createdAt",
					username
			FROM posts 
			WHERE post_id = $1`,
			[ postId ]
		);

		const post = postRes.rows[0];

		if (!post) throw new NotFoundError(`No post: ${postId}`);

		const commentsRes = await db.query(
			`SELECT comment_id AS "commentId",
					parent_id AS "parentId",
					message,
					username,
					created_at AS "createdAt" 
			FROM comments 
			WHERE post_id = $1
			AND parent_id IS NULL`,
			[ postId ]
		);

		// get number of likes each comment has
		for (let comment of commentsRes.rows) {
			const commentLikesRes = await db.query(
				`SELECT COUNT(*)
			FROM comment_likes
			WHERE comment_id = $1`,
				[ comment.commentId ]
			);

			comment.numLikes = commentLikesRes.rows[0].count;
		}

		// recursive query for getting all subcomments of each parent level comment
		for (let comment of commentsRes.rows) {
			const commentChildrenRes = await db.query(
				`WITH RECURSIVE children AS (
					SELECT
						comment_id,
						parent_id,
						message,
						username,
						created_at
					FROM
						comments
					WHERE
						comment_id = $1
					UNION
						SELECT
							c.comment_id,
							c.parent_id,
							c.message,
							c.username,
							c.created_at
						FROM
							comments c
						INNER JOIN children ch ON ch.comment_id = c.parent_id
				)
				SELECT
					*
				FROM
					children`,
				[ comment.commentId ]
			);

			// get number of likes each child comment has
			for (let comment of commentChildrenRes.rows.slice(1)) {
				const commentChildrenLikesRes = await db.query(
					`SELECT COUNT(*)
					FROM comment_likes
					WHERE comment_id = $1`,
					[ comment.comment_id ]
				);

				comment.numLikes = commentChildrenLikesRes.rows[0].count;
			}
			comment.children = commentChildrenRes.rows.slice(1);
		}

		return commentsRes.rows;
	}

	/**
	* We want to return: 
	* 
	* {users: [{username, profileImageURL, posts}, ... ]}
	* where posts is [{postId, postURL, caption, createdAt}, ...]
	* 
	* Users should be the current user and/or their followers. Order by descending.
	* 
	*/

	static async getAllUserFollowerPosts(username) {
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

		const usersPostsRes = await db.query(
			`SELECT
				p.post_id AS "postId",
				p.post_url AS "postURL",
				p.caption,
				p.created_at AS "createdAt",
				p.username,
				u.profile_image_url AS "profileImageURL"
			FROM posts p
			JOIN users u
			ON p.username = u.username
			WHERE p.username IN (SELECT f.username_being_followed FROM follows f WHERE f.username_following = $1)
			ORDER BY p.created_at DESC;`,
			[ username ]
		);

		for (let post of usersPostsRes.rows) {
			const postLikesRes = await db.query(
				`SELECT COUNT(*)
			FROM post_likes
			WHERE post_id = $1`,
				[ post.postId ]
			);

			post.numLikes = postLikesRes.rows[0].count;
		}

		return usersPostsRes.rows;
	}

	/*
	*	This query finds all users that are not followed by the current user.
	*
	*/

	static async getAllNotFollowedBy(username) {
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

		const usersRes = await db.query(
			`SELECT username, 
				profile_image_url AS "profileImageURL"
			FROM users 
			JOIN follows
			ON users.username = follows.username_being_followed
			WHERE follows.username_following IS NOT $1`,
			[ username ]
		);

		const users = usersRes.rows;

		return users;
	}
}

module.exports = User;
