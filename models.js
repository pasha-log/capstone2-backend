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
	id: {
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
