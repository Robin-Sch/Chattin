/* eslint-disable no-undef */
$(function() {
	const { ipcRenderer } = require('electron');
	const SaveData = require('../js/SaveData.js');
	const savedata = new SaveData({
		configName: 'user-preferences',
	});
	const currentData = new SaveData({
		configName: 'current',
	});

	let server = undefined;
	let token = undefined;

	const getPrevious = setInterval(() => {
		if (!server || !token) {
			server = currentData.get('server');
			token = savedata.get('token');
		} else {
			let socket = io(server);
			let room = savedata.get('room');
			const uid = savedata.get('uid');

			socket.on('authenticated', () => {
				setTimeout(() => {
					socket.emit('joinRoom', room);
				}, 1000);
			});

			socket.on('connect', () => {
				error(false);
			});

			socket.on('disconnect', () => {
				ipcRenderer.send('close');
			});
			socket.on('connect_failed', () => {
				ipcRenderer.send('close');
			});
			socket.on('connect_error', () => {
				ipcRenderer.send('close');
			});
			socket.on('slowmode', (data, timeout) => {
				$('#send_message').css('border-color', 'red');
				$('#send_message').val(data.message);
				setTimeout(() => {
					$('#send_message').css('border-color', 'black');
					return false;
				}, timeout);
			});
		
			ipcRenderer.on('start', (event, data) => {
				if (data.room !== room || data.uid !== uid) ipcRenderer.send('close');
			});

			$('#send_message_form').submit((e) => {
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
			$('#change_room_form').submit((e) => {
				e.preventDefault();
				const newRoom = $('#change_room').val();
				if (!newRoom) return;
				socket.emit('joinRoom', newRoom);
				room = newRoom;
				$('#change_room').val('');
				$('#chat-messages').text('');
				return false;
			});
			socket.on('message', (data) => {
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
			socket.on('error', (msg) => {
				ipcRenderer.send(msg);
			});
			socket.on('users', (users) => {
				$('#users').html(`${users} user${users > 1 ? 's' : ''} in chat`);
			});
			socket.on('details', (data) => {
				$('#server').html(`Room: ${data.room}<br>Server: ${data.server}`);
			});

			socket.emit('authenticate', {token});

			clearInterval(getPrevious);
		}
	}, 500)
});

const error = (errorBool, msg) => {
	if(errorBool) {
		$('#chat-errors').text(msg);
		$('#send_message').prop('placeholder', msg);
		$('#send_message').prop('disabled', true);
	} else {
		$('#chat-errors').text('');
		$('#send_message').prop('placeholder', 'Send a message.');
		$('#send_message').prop('disabled', false);
	}
}