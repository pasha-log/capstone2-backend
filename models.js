// This was my Sequelize version for the models of this project

require('dotenv').config();
const password = process.env.UBUNTU_PASSWORD;

const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(`postgres://pasha:${password}@127.0.0.1:5432/instagram`);

const Users = sequelize.define('Users', {
	user_id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	full_name: {
		type: DataTypes.STRING,
		allowNull: false
	},
	username: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true
	},
	password: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true
	},
	email: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true,
		isEmail: true
	},
	profile_image_url: {
		type: DataTypes.TEXT,
		allowNull: true,
		defaultValue: './public/images/default-pic.png'
	},
	bio: {
		type: DataTypes.TEXT,
		allowNull: true,
		validate: {
			len: [ 1, 2200 ]
		}
	}
});

const Follows = sequelize.define('Follows', {
	follow_id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	user_being_followed_id: {
		type: DataTypes.INTEGER,
		allowNull: false,
		references: {
			model: 'Users',
			key: 'user_id'
		}
	},
	user_following_id: {
		type: DataTypes.INTEGER,
		allowNull: false,
		references: {
			model: 'Users',
			key: 'user_id'
		}
	}
});

const PostLikes = sequelize.define('PostLikes', {
	post_like_id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	user_id: {
		type: DataTypes.INTEGER,
		allowNull: false,
		references: {
			model: 'Users',
			key: 'user_id'
		}
	},
	post_id: {
		type: DataTypes.INTEGER,
		allowNull: false,
		references: {
			model: 'Posts',
			key: 'post_id'
		}
	}
});

const CommentLikes = sequelize.define('CommentLikes', {
	comment_like_id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	user_id: {
		type: DataTypes.INTEGER,
		allowNull: false,
		references: {
			model: 'Users',
			key: 'user_id'
		}
	},
	comment_id: {
		type: DataTypes.INTEGER,
		allowNull: false,
		references: {
			model: 'Comments',
			key: 'comment_id'
		}
	}
});

const Comments = sequelize.define(
	'Comments',
	{
		comment_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		parent_id: {
			type: DataTypes.INTEGER,
			defaultValue: -1
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'Users',
				key: 'user_id'
			}
		},
		post_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'Posts',
				key: 'post_id'
			}
		},
		message: {
			type: DataTypes.TEXT,
			allowNull: false,
			validate: {
				len: [ 1, 2200 ]
			}
		}
	},
	{
		timestamps: true
	}
);

const Posts = sequelize.define(
	'Posts',
	{
		post_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'Users',
				key: 'user_id'
			}
		},
		post_url: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		caption: {
			type: DataTypes.TEXT,
			allowNull: false,
			validate: {
				len: [ 1, 2200 ]
			}
		},
		watermark: {
			type: DataTypes.TEXT,
			allowNull: true,
			validate: {
				len: [ 1, 35 ]
			}
		}
	},
	{
		timestamps: true
	}
);
sequelize
	.sync({ alter: true })
	.then((result) => {
		console.log(result);
	})
	.catch((err) => {
		console.log(err);
	});

module.exports = {
	Users,
	Follows,
	PostLikes,
	CommentLikes,
	Comments,
	Posts
};

// const bcrypt = require('bcrypt');

// const db = require('../db.js');
// const { BCRYPT_WORK_FACTOR } = require('../config');

// const testPostsCreatedAt = [];
// const testCommentsCreatedAt = [];

// async function commonBeforeAll() {
// 	await db.query(
// 		`
//         INSERT INTO users(username,
//                           password,
//                           full_name,
//                           email,
//                           bio)
//         VALUES ('u1', $1, 'U1FN', 'u1@email.com', 'test_user 1 stuff'),
//                ('u2', $2, 'U2FN', 'u2@email.com', 'test_user 2 stuff'),
//                ('u3', $3, 'U3FN', 'u3@email.com', 'test_user 3 stuff'),
//                ('u4', $4, 'U4FN', 'u4@email.com', 'test_user 4 stuff')
//         RETURNING username`,
// 		[
// 			await bcrypt.hash('password1', BCRYPT_WORK_FACTOR),
// 			await bcrypt.hash('password2', BCRYPT_WORK_FACTOR),
// 			await bcrypt.hash('password3', BCRYPT_WORK_FACTOR),
// 			await bcrypt.hash('password4', BCRYPT_WORK_FACTOR)
// 		]
// 	);

// 	// u1 will be following everyone
// 	// only u2 and u3 will be following u1 back
// 	await db.query(
// 		`
// 	    INSERT INTO follows(username_being_followed, username_following)
// 	    VALUES ('u2', 'u1'), ('u3', 'u1'), ('u4', 'u1'), ('u1', 'u2'), ('u1', 'u3')`
// 	);

// 	// u1, u2, u3 will all have posts
// 	const resultsPosts = await db.query(
// 		`
// 		INSERT INTO posts(username, post_url, caption)
// 		VALUES ('u1', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc14uK4IYYBB8TU2JnCEmxKMeGEbfw_flCuQ&usqp=CAU', 'a fake post by u1'),
// 		('u2', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc14uK4IYYBB8TU2JnCEmxKMeGEbfw_flCuQ&usqp=CAU', 'a fake post by u2'),
// 		('u3', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc14uK4IYYBB8TU2JnCEmxKMeGEbfw_flCuQ&usqp=CAU', 'a fake post by u3')
// 		RETURNING created_at`
// 	);
// 	testPostsCreatedAt.splice(0, 0, ...resultsPosts.rows.map((r) => r.created_at));

// 	// u1 will like u2's post and their own post
// 	await db.query(
// 		`
// 		INSERT INTO post_likes(username, post_id)
// 		VALUES ('u1', 1), ('u1', 2)`
// 	);

// 	// u2 will make a comment on u1's post and u1 will like it, and u2 will comment on their own post
// 	const resultsComments = await db.query(
// 		`
// 		INSERT INTO comments(message, username, post_id)
// 		VALUES ('nice post, u1!', 'u2', '1'), ('here are some hashtags I forgot!', 'u2', '2')
// 		RETURNING created_at`
// 	);
// 	testCommentsCreatedAt.splice(0, 0, ...resultsComments.rows.map((r) => r.created_at));
// }

// async function commonBeforeEach() {
// 	await db.query('BEGIN');
// }

// async function commonAfterEach() {
// 	await db.query('ROLLBACK');
// }

// async function commonAfterAll() {
// 	await db.end();
// }

// module.exports = {
// 	commonBeforeAll,
// 	commonBeforeEach,
// 	commonAfterEach,
// 	commonAfterAll,
// 	testPostsCreatedAt,
// 	testCommentsCreatedAt
// };
