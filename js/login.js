const electron = require('electron');
const { ipcRenderer } = electron;
const SaveData = require('../js/SaveData.js');
const savedata = new SaveData({
	configName: 'user-preferences',
});
const currentData = new SaveData({
	configName: 'current',
});

let server = undefined;
let oldUsername = undefined;
let oldRoom = undefined;

const getPrevious = setInterval(() => {
	if (!oldUsername) {
		oldUsername = savedata.get('username');
		if (oldUsername) document.getElementById('Lusername').value = oldUsername;
	
		oldRoom = savedata.get('room');
		if (oldRoom) document.getElementById('Lroom').value = oldRoom;

		server = currentData.get('server');
		if (!server) document.getElementById('response').innerHTML = 'There are problems connecting to the server!';
	} else {
		clearInterval(getPrevious);
	}
}, 500)

const login = async () => {
	const username = document.getElementById('Lusername').value;
	const password = document.getElementById('Lpassword').value;
	let room = document.getElementById('Lroom').value;
	if (!room) room = 'public';
	
	const valid = validate(username, password, room);
	if (!valid.success) return alert(valid.message);

	const body = {
		username,
		password,
		room,
	};
	fetch(`${server}/login`, {
		method: 'POST',
		body: JSON.stringify(body),
		headers: { 'Content-Type': 'application/json' },
	}).then(res => res.json())
		.then(json => {
			if (!json.success) {
				return document.getElementById('response').innerHTML = json.message;
			} else {
				savedata.set('username', username);
				savedata.set('room', room);
				ipcRenderer.send('open:index', { uid: json.uid, room, token: json.token, uid: json.uid });
			}
		}).catch(() => {
			document.getElementById('response').innerHTML = 'There are problems connecting to the server!';
		});
}
const register = async () => {
	const username = document.getElementById('Rusername').value;
	const password = document.getElementById('Rpassword').value;
	let room = document.getElementById('Rroom').value;
	if (!room) room = 'public';

	const valid = validate(username, password, room);
	if (!valid.success) return alert(valid.message);

	const body = {
		username,
		password,
		room,
	};
	fetch(`${server}/register`, {
		method: 'POST',
		body: JSON.stringify(body),
		headers: { 'Content-Type': 'application/json' },
	}).then(res => res.json())
		.then(json => {
			if (!json.success) {return document.getElementById('response').innerHTML = json.message;} else {
				savedata.set('username', username);
				savedata.set('room', room);
				ipcRenderer.send('open:index', { uid: json.uid, room, token: json.token, uid: json.uid });
			}
		}).catch(() => {
			document.getElementById('response').innerHTML = 'There are problems connecting to the server!';
		});
}
const validate = (username, password, room) => {
	if (!username) {
		return { success: false, message: 'Missing your username!' };
	} else if (username.length < 1 || username.length > 32) {
		return { success: false, message: 'Your username can\'t be longer than 32 characters' };
	} else if (!password) {
		return { success: false, message: 'Missing your password!' };
	} else if (!room) {
		return { success: false, message: 'Missing the room!' };
	} else if (room.length < 0 || room.length > 32) {
		return { success: false, message: 'Your room name can\'t be longer than 32 characters!' };
	} else {
		return { success: true };
	}
}

const change = (block) => {
	const other = block == 'login' ? 'register' : 'login';
	document.getElementById(block).style = 'display: block';
	document.getElementById(other).style = 'display: none';
}

const error = (errorBool, msg) => {
	if (errorBool) {
		document.getElementById('response').innerHTML = msg;
	} else {
		document.getElementById('response').innerHTML = '';
	}
}