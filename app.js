require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
const cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { authenticateJWT } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
var app = express();
const helmet = require('helmet');

app.use(helmet());
app.use(cors());
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(authenticateJWT);
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use(express.static('public'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404));
});

/** Generic error handler; anything unhandled goes here. */
app.use(function(err, req, res, next) {
	if (process.env.NODE_ENV !== 'test') console.error(err.stack);
	const status = err.status || 500;
	const message = err.message;

	return res.status(status).json({
		error: { message, status }
	});
});

app.use((error, req, res, next) => {
	if (error instanceof multer.MulterError) {
		if (error.code === 'LIMIT_FILE_SIZE') {
			return res.status(400).json({
				message: 'File is too large'
			});
		}

		if (error.code === 'LIMIT_FIELD_COUNT') {
			return res.status(400).json({
				message: 'File limit reached'
			});
		}

		if (error.code === 'LIMIT_UNEXPECTED_FILE') {
			return res.status(400).json({
				message: 'File must be an image'
			});
		}
	}
});

module.exports = app;
