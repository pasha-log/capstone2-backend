'use strict';

/** Routes for users. */

const express = require('express');
const { ensureLoggedIn, authenticateJWT, ensureCorrectUser } = require('../middleware/auth');
const userUpdateSchema = require('../schemas/userUpdate.json');
const User = require('../models/user');
const { schemaValidator } = require('../helpers/schemaValidator');

/** AWS S3 dependencies */
require('aws-sdk/lib/maintenance_mode_message').suppress = true;
const multer = require('multer');
const { s3Uploadv2, s3Delete } = require('../s3Service');
require('dotenv').config();

const router = express.Router();

/** GET /[username] => { user }
 *
 * Returns { username, fullName, email, profileImageURL, bio, posts, postLikes, commentLikes, following, followers }
 *   where posts is [{ postId, postURL, caption, watermark, filter, createdAt }, ...]
 *   where postLikes is [{ postId, username, postURL, caption, watermark, filter, createdAt }, ...]
 *   where following is [{username, fullName, profileImageURL}, ...]
 *   where followers is [{username, fullName, profileImageURL}, ...]
 *
 * Authorization required: same user-as-:username
 **/

router.get('/:username', ensureLoggedIn, async (req, res, next) => {
	try {
		const user = await User.get(req.params.username);
		return res.json({ user });
	} catch (err) {
		return next(err);
	}
});

// AWS S3 Bucket upload setup

const memory = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
	if (file.type.split('/')[0] === 'image') {
		cb(null, true);
	} else {
		cb(new Error('file is not of the correct type'), false);
	}
};

const upload = multer({
	storage: memory
	// fileFilter: fileFilter,
	// limits: { fileSize: 1000000, files: 1 }
});

router.post('/upload', upload.single('single'), async (req, res, next) => {
	try {
		const file = req.file;
		const result = await s3Uploadv2(file);
		console.log(result);
		res.json({ status: 'success', result });
	} catch (err) {
		return next(err);
	}
});

// Post route for creating a post.

router.post('/create', ensureLoggedIn, async (req, res, next) => {
	try {
		const post = await User.createPost(req.body);
		return res.json({ post });
	} catch (err) {
		return next(err);
	}
});

// Get route for getting all the comments of a single post.

router.get('/comments/:postId', ensureLoggedIn, async (req, res, next) => {
	try {
		const comments = await User.getPostComments(req.params.postId);
		return res.json({ comments });
	} catch (err) {
		return next(err);
	}
});

// Post route for creating a comment.

router.post('/comment', ensureLoggedIn, async (req, res, next) => {
	try {
		const comment = await User.comment(req.body);
		return res.json({ comment });
	} catch (err) {
		return next(err);
	}
});

// Post route for following another user.

router.post('/follow', ensureLoggedIn, async (req, res, next) => {
	try {
		const follow = await User.follow(req.body.usernameFollowing, req.body.usernameBeingFollowed);
		console.log(follow);
		return res.json({ status: 'success' });
	} catch (err) {
		return next(err);
	}
});

// Post route for unfollowing another user.

router.post('/unfollow', ensureLoggedIn, async (req, res, next) => {
	try {
		const unfollow = await User.unfollow(req.body.usernameUnfollowing, req.body.usernameBeingUnfollowed);
		console.log(unfollow);
		return res.json({ status: 'success' });
	} catch (err) {
		return next(err);
	}
});

// Get route for getting all users or however many that match a particular search string.

router.get('/', async (req, res, next) => {
	try {
		const users = await User.findAll(req.query);
		return res.json({ users });
	} catch (err) {
		return next(err);
	}
});

// Get route for getting all a user's follower's posts for the homepage feed.

router.get('/:username/followerPosts/', ensureLoggedIn, async (req, res, next) => {
	try {
		const posts = await User.getAllUserFollowerPosts(req.params.username);
		return res.json({ posts });
	} catch (err) {
		return next(err);
	}
});

// Post route for liking a post or comment.

router.post('/like', ensureLoggedIn, async (req, res, next) => {
	try {
		const like = await User.like(req.body.username, req.body.commentOrPostId, req.body.likeType);
		return res.json({ status: 'success' });
	} catch (err) {
		return next(err);
	}
});

// Post route for unliking a post or comment.

router.post('/unlike', ensureLoggedIn, async (req, res, next) => {
	try {
		const unlike = await User.unlike(req.body.username, req.body.commentOrPostId, req.body.likeType);
		return res.json({ status: 'success' });
	} catch (err) {
		return next(err);
	}
});

// Patch route for updating a user's information.

router.patch('/:username', ensureLoggedIn, async (req, res, next) => {
	try {
		schemaValidator(req.body, userUpdateSchema);

		const user = await User.update(req.params.username, req.body);
		return res.json({ user });
	} catch (err) {
		return next(err);
	}
});

// Delete route for deleting a user's post.

router.delete('/deletePost', ensureLoggedIn, async (req, res, next) => {
	try {
		await s3Delete(req.body.postKey);
		const postDeletion = await User.deletePost(req.body);
		return res.json({ postDeletion, status: 'success' });
	} catch (err) {
		return next(err);
	}
});

// Delete a file only from S3 bucket in caption form phase discard scenario.

router.delete('/deleteS3File', ensureLoggedIn, async (req, res, next) => {
	try {
		await s3Delete(req.body.key);
		return res.json({ status: 'success' });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
