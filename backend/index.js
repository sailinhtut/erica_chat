const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'message_data.json');

function addMessage(message) {
	try {
		if (!fs.existsSync(dataFile)) {
			fs.writeFileSync(dataFile, '[]', 'utf8');
		}
		const content = fs.readFileSync(dataFile, 'utf8');
		let json = [];
		try {
			json = JSON.parse(content);
			if (!Array.isArray(json)) {
				json = [];
			}
		} catch (parseError) {
			console.error('Error parsing JSON:', parseError);
			json = [];
		}
		json.push(message);
		fs.writeFileSync(dataFile, JSON.stringify(json, null, 2), 'utf8');
	} catch (err) {
		console.error('Error handling the message file:', err);
	}
}

function deleteMessageById(userId, messageId) {
	let messages = [];

	try {
		if (fs.existsSync(dataFile)) {
			const content = fs.readFileSync(dataFile, 'utf8');
			messages = JSON.parse(content);
		}
	} catch (err) {
		console.error('Error reading the message file:', err);
		return;
	}

	const selectedMessage = messages.find((e) => e.id === messageId);
	let filteredMessages = messages;
	if (selectedMessage.userId === userId) {
		filteredMessages = messages.filter((msg) => msg.id !== messageId);
	}

	try {
		fs.writeFileSync(dataFile, JSON.stringify(filteredMessages, null, 2), 'utf8');
	} catch (err) {
		console.error('Error writing to the message file:', err);
	}
}

function getMessages() {
	if (!fs.existsSync(dataFile)) {
		fs.writeFileSync(dataFile, '[]', 'utf8');
	}
	const content = fs.readFileSync(dataFile, 'utf8');
	let json = [];
	try {
		json = JSON.parse(content);
		if (!Array.isArray(json)) {
			json = [];
		}
	} catch (parseError) {
		console.error('Error parsing JSON:', parseError);
		json = [];
	}
	return json;
}

const authHandler = (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith('Basic')) {
		return res.status(401).json({ message: 'Unauthorized Access' });
	}

	const hashCredential = authHeader.split(' ')[1];
	const credentials = Buffer.from(hashCredential, 'base64').toString('utf-8');
	const [username, password] = credentials.split(':');

	const valid_username = 'scar';
	const valid_password = 'king';

	if (username !== valid_username || password !== valid_password) {
		return res.status(403).json({ message: 'Invalid Credentials' });
	}

	next();
};

const app = express();
app.use(cors());

app.get('/', (req, res) => res.send('Erica Chat Backend Version 1.0.0'));
app.post('/clear', authHandler, (req, res) => {
	if (fs.existsSync(dataFile)) {
		fs.unlinkSync(dataFile);
	}
	res.json({ message: 'Chat Box is cleared' });
});

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		// origin: 'https://erica.sailinhtut.dev',
		origin: 'http://localhost:4000',
		methods: ['GET', 'POST'],
	},
});

io.on('connection', (socket) => {
	console.log('🔌 A user connected:', socket.id);

	socket.on('disconnect', () => {
		console.log('❌ A user disconnected:', socket.id);
	});

	socket.on('message', (msg) => {
		addMessage(JSON.parse(msg));
		io.emit('message', msg);
	});

	socket.on('getMessages', (msg) => {
		const data = JSON.stringify(getMessages());
		io.emit('getMessages', data);
	});

	socket.on('deleteMessage', (userId, messageId) => {
		deleteMessageById(userId, messageId);
	});
});

server.listen(4010, () => {
	console.log('✅ Express server running on http://localhost:4010');
});
