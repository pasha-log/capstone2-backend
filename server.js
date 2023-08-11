'use strict';

const app = require('./app');
const { PORT } = require('./config');

const server = require('http').createServer(app);
app.set('trust proxy', 1);

require('dotenv').config();

// attempt at a solution
// var express = require('express');
// attempt at a solution

// const io = require('socket.io')(server, {
// 	cors: {
// 		origin: '*',
// 		// origin: 'https://instapost.herokuapp.com',
// 		methods: [ 'GET', 'POST' ],
// 		allowedHeaders: [ 'my-custom-header' ],
// 		credentials: 'true'
// 	}
// });

// if (process.env.NODE_ENV === 'production') {
// 	// Set static folder
// 	app.use(express.static('./client/build'));
// 	app.get('*', (req, res) => {
// 		res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
// 	});
// }

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

if (process.env.NODE_ENV === 'production') {
	// Set static folder
	app.use(express.static('./client/build'));
	app.get('*', (req, res) => {
		res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
	});
}

server.listen(PORT, () => {
	console.log(`Started on http://localhost:${PORT}`);
});

const io = require('socket.io')(server, {
	cors: {
		// origin: '*',
		origin: 'https://pasha-log-instapost.surge.sh',
		methods: [ 'GET', 'POST' ],
		credentials: 'true'
	}
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
