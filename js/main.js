/* eslint-disable no-undef */
$(function() {
	const SaveData = require('../js/SaveData.js');
	const savedata = new SaveData({
		configName: 'user-preferences',
	});
	const currentData = new SaveData({
		configName: 'current',
	});
	let server = currentData.get('server');
	if (!server) ipcRenderer.send('newServer');

	const electron = require('electron');
	const ipcRenderer = electron.ipcRenderer;
	let socket = io(server);

	socket.on('disconnect', function() {
		error('There are problems connecting to the server!');
		ipcRenderer.send('newServer');
	});
	socket.on('connect_failed', function() {
		error('There are problems connecting to the server!');
		ipcRenderer.send('newServer');
	});
	socket.on('connect_error', function() {
		error('There are problems connecting to the server!');
		ipcRenderer.send('newServer');
	});
	socket.on('slowmode', function(data, timeout) {
		// $('#send_message').prop('disabled', true);
		$('#send_message').css('border-color', 'red');
		$('#send_message').val(data.message);
		setTimeout(() => {
			// $('#send_message').prop('disabled', false);
			$('#send_message').css('border-color', 'black');
			return false;
		}, timeout);
	});

	let room = savedata.get('room');
	const uid = savedata.get('uid');
	socket.emit('joinRoom', room);

	ipcRenderer.on('newServer', function(event, data) {
		server = data.server;
		socket = io(server);
	});
	ipcRenderer.on('start', function(event, data) {
		if (data.room !== room || data.uid !== uid) ipcRenderer.send('close');
	});

	$('#send_message_form').submit(function(e) {
		e.preventDefault();
		const data = {
			message: $('#send_message').val(),
			uid,
			room,
		};
		if (!data.message) return;
		socket.emit('message', data);
		$('#send_message').val('');
		return false;
	});
	$('#change_room_form').submit(function(e) {
		e.preventDefault();
		const newRoom = $('#change_room').val();
		if (!newRoom) return;
		socket.emit('joinRoom', newRoom);
		room = newRoom;
		$('#change_room').val('');
		$('#chat-messages').text('');
		return false;
	});
	socket.on('message', function(data) {
		$('#chat-messages').append($('<p style="white-space: pre-line">').text(`${data.username}:\n${data.message}`));
		$('#chat').animate({ scrollTop: $('#chat').prop('scrollHeight') });
		if (data.uid !== uid) {
			const audio = new Audio('../sounds/message.mp3');
			audio.play();
			const myNotification = new Notification(data.username, {
				body: data.message,
			});
			myNotification.onclick = () => {
				ipcRenderer.send('focus');
			};
		}
	});
	socket.on('error', function(msg) {
		ipcRenderer.send(msg);
	});
	socket.on('users', function(users) {
		$('#users').html(`${users} user${users > 1 ? 's' : ''} in chat`);
	});
	socket.on('details', function(data) {
		$('#server').html(`Room: ${data.room}<br>Server: ${data.server}`);
	});
});

function error(msg) {
	$('#chat-errors').text(msg);
	$('#send_message').prop('placeholder', msg);
	$('#send_message').prop('disabled', true);
}