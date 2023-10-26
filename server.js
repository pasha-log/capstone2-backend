'use strict';

const app = require('./app');
const { PORT } = require('./config');

const server = require('http').createServer(app);
app.set('trust proxy', 1);

require('dotenv').config();

// WORKS FOR RUNNING LOCALLY
// const io = require('socket.io')(server, {
// 	cors: {
// 		origin: '*',
// 		methods: [ 'GET', 'POST' ],
// 		allowedHeaders: [ 'my-custom-header' ],
// 		credentials: 'true'
// 	}
// });

// server.listen(PORT, () => {
// 	console.log(`Started on http://localhost:${PORT}`);
// });

// io.on('connection', (socket) => {
// 	const username = socket.handshake.query.username;
// 	socket.join(username);

// 	socket.on('send-message', ({ recipients, text }) => {
// 		recipients.forEach((recipient) => {
// 			const newRecipients = recipients.filter((r) => r !== recipient);
// 			newRecipients.push(username);
// 			socket.broadcast.to(recipient).emit('receive-message', {
// 				recipients: newRecipients,
// 				sender: username,
// 				text
// 			});
// 		});
// 	});
// });

const express = require('express');

// if (process.env.NODE_ENV === 'production') {
// 	// Set static folder
// 	app.use(express.static('./client/build'));
// 	app.get('*', (req, res) => {
// 		res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
// 	});
// }

server.listen(PORT, () => {
	console.log(`Started on http://localhost:${PORT}`);
});

const io = require('socket.io')(server, {
	cors: {
		// origin: 'https://pasha-log-instapost.surge.sh',
		origin: '*',
		methods: [ 'GET', 'POST' ],
		credentials: 'true'
	}
});

const _dirname = path.dirname('');
const buildPath = path.join(_dirname, '../Unit50Capstone2Frontend/build');

app.use(express.static(buildPath));

app.get('/*', function(req, res) {
	res.sendFile(path.join(__dirname, '../Unit50Capstone2Frontend/build/index.html'), function(err) {
		if (err) {
			res.status(500).send(err);
		}
	});
});

io.on('connection', (socket) => {
	const username = socket.handshake.query.username;
	socket.join(username);

	socket.on('send-message', ({ recipients, text }) => {
		recipients.forEach((recipient) => {
			const newRecipients = recipients.filter((r) => r !== recipient);
			newRecipients.push(username);
			socket.broadcast.to(recipient).emit('receive-message', {
				recipients: newRecipients,
				sender: username,
				text
			});
		});
	});
});
