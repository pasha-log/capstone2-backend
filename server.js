'use strict';

const app = require('./app');
const { PORT } = require('./config');

// const server = require('http').createServer(app);

var express = require('express');
const INDEX = '/index.html';
const server = express();

server.use((req, res) => res.sendFile(INDEX, { root: __dirname })).listen(PORT, () => {
	console.log(`Listening on ${PORT}`);
});

const io = require('socket.io')(server, {
	cors: {
		origin: '*',
		// origin: 'https://instapost.herokuapp.com',
		methods: [ 'GET', 'POST' ],
		allowedHeaders: [ 'my-custom-header' ],
		credentials: 'true'
	}
});

// server.listen(PORT, () => {
// 	console.log(`Started on http://localhost:${PORT}`);
// });

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
