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
let oldEmail = undefined;
let oldRoom = undefined;

const getPrevious = setInterval(() => {
	if (!oldEmail) {
		oldEmail = savedata.get('email');
		if (oldEmail) document.getElementById('Lemail').value = oldEmail;
	
		oldRoom = savedata.get('room');
		if (oldRoom) document.getElementById('Lroom').value = oldRoom;

		server = currentData.get('server');
		if (!server) document.getElementById('response').innerHTML = 'There are problems connecting to the server!';
	} else {
		clearInterval(getPrevious);
	}
}, 500)

const login = async () => {
	const email = document.getElementById('Lemail').value;
	const password = document.getElementById('Lpassword').value;
	let room = document.getElementById('Lroom').value;
	if (!room) room = 'public';
	if (!email) {
		return alert('Missing your email!');
	} else if (!password) {
		return alert('Missing your password!');
	} else if (room.length < 0 || room.length > 25) {
		return alert('Your room name can\'t be longer than 25 characters!');
	} else if (!server) {
		document.getElementById('response').innerHTML = 'There are problems connecting to the server!';
	} else {
		const body = {
			email,
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
					savedata.set('email', email);
					savedata.set('room', room);
					ipcRenderer.send('open:index', { uid: json.uid, room, token: json.token, uid: json.uid });
				}
			}).catch(() => {
				document.getElementById('response').innerHTML = 'There are problems connecting to the server!';
			});
	}
}
const register = async () => {
	const name = document.getElementById('Rname').value;
	const email = document.getElementById('Remail').value;
	const password = document.getElementById('Rpassword').value;
	let room = document.getElementById('Rroom').value;
	if (!room) room = 'public';
	if (!name) {
		return alert('Missing your name!');
	} else if (!email) {
		return alert('Missing your email!');
	} else if (!password) {
		return alert('Missing your password!');
	} else if (room.length < 0 || room.length > 25) {
		return alert('Your room name can\'t be longer than 25 characters!');
	} else if (name.length < 0 || name.length > 25) {
		return alert('Your name can\'t be longer than 25 characters!');
	} else if (!server) {
		document.getElementById('response').innerHTML = 'There are problems connecting to the server!';
	} else {
		const body = {
			name,
			email,
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
					savedata.set('email', email);
					savedata.set('room', room);
					ipcRenderer.send('open:index', { uid: json.uid, room, token: json.token, uid: json.uid });
				}
			}).catch(() => {
				document.getElementById('response').innerHTML = 'There are problems connecting to the server!';
			});
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