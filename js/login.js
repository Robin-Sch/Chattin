/* eslint-disable no-unused-vars */
/* eslint-disable  no-undef */
const electron = require('electron');
const { ipcRenderer } = electron;
const SaveData = require('../js/SaveData.js');
const savedata = new SaveData({
	configName: 'user-preferences',
});
const currentData = new SaveData({
	configName: 'current',
});
let server = currentData.get('server');
if (!server) ipcRenderer.send('getServer');
const oldEmail = savedata.get('email');
if (oldEmail) document.getElementById('Lemail').value = oldEmail;
const oldRoom = savedata.get('room');
if (oldRoom) document.getElementById('Lroom').value = oldRoom;

ipcRenderer.on('newServer', function(event, data) {
	server = data.server;
	console.log(data.data);
	if (data.data == 'login') login();
	else if (data.data == 'register') register();
});

async function login() {
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
		ipcRenderer.send('newServer', 'login');
		return alert('I can\'t connect to the server, try again!');
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
					savedata.set('uid', json.uid);
					savedata.set('email', email);
					savedata.set('room', room);
					ipcRenderer.send('open:index', { uid: json.uid, room: room });
				}
			}).catch(() => {
				ipcRenderer.send('newServer', 'login');
				document.getElementById('response').innerHTML = 'It seems like our server is offline!';
			});
	}
}
async function register() {
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
		ipcRenderer.send('newServer', 'register');
		return alert('I can\'t connect to the server, try again!');
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
					savedata.set('uid', json.uid);
					savedata.set('email', email);
					savedata.set('room', room);
					ipcRenderer.send('open:index', { uid: json.uid, room: room });
				}
			}).catch(() => {
				ipcRenderer.send('newServer', 'register');
				document.getElementById('response').innerHTML = 'It seems like our server is offline!';
			});
	}
}
async function change(block) {
	const other = block == 'login' ? 'register' : 'login';
	document.getElementById(block).style = 'display: block';
	document.getElementById(other).style = 'display: none';
	console.log(block, other);
}