'use strict';

/** Routes for users. */

const express = require('express');
const { ensureCorrectUser } = require('../middleware/auth');
// const { BadRequestError } = require('../expressError');
const User = require('../models/user');

const router = express.Router();

/** GET /[username] => { user }
 *
 * Returns { username, fullName, email, profileImageURL, bio, posts, postLikes }
 *   where posts is [{ postId, postURL, caption, watermark, filter, createdAt }, ...]
 *   where postLikes is [{ postId, username, postURL, caption, watermark, filter, createdAt }, ...]
 *   where following is [{username, fullName, profileImageURL}, ...]
 *   where followers is [{username, fullName, profileImageURL}, ...]
 *
 * Authorization required: same user-as-:username
 **/

router.get('/:username', ensureCorrectUser, async function(req, res, next) {
	try {
		const user = await User.get(req.params.username);
		return res.json({ user });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
