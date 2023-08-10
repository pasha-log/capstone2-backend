'use strict';

const app = require('./app');
const { PORT } = require('./config');

// const server = require('http').createServer(app);

// attempt at a solution
// var express = require('express');
const INDEX = 'index.html';
// const server = express()
const server = require('http').createServer(app);

// server.use((req, res) => res.sendFile(INDEX, { root: __dirname })).listen(PORT, () => {
// 	console.log(`Listening on ${PORT}`);
// });
// attempt at a solution

const io = require('socket.io')(server, {
	cors: {
		origin: '*',
		// origin: 'https://instapost.herokuapp.com',
		methods: [ 'GET', 'POST' ],
		allowedHeaders: [ 'my-custom-header' ],
		credentials: 'true'
	}
});

server.listen(PORT, () => {
	console.log(`Started on http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
	res.sendFile(INDEX, { root: __dirname });
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

// const PORT = process.env.PORT || 3000
// const INDEX = './index.html'

// const socketIO = require('socket.io')
// const express = require('express')

// const app = express()
// const server = app.listen(PORT, () => {
//   console.log('SERVER LISTENING ON PORT http://localhost:3000')
// })
// const io = socketIO(server)

// app.get('/', (req, res) => {
//   res.sendFile(INDEX, { root: __dirname })
// })

// io.on('connection', (socket) => {
//   console.log('Client connected')
//   socket.on('disconnect', () => console.log('Client disconnected'))
// })
