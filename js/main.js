/* eslint-disable no-undef */
$(function() {
	const { ipcRenderer, session } = require('electron');
	const { sessionKeys, loadEncryptionObjects, loadSessionKeys, pack, unpack } = require('../js/crypt.js');
	const SaveData = require('../js/SaveData.js');
	const savedata = new SaveData({
		configName: 'user-preferences',
	});
	const currentData = new SaveData({
		configName: 'current',
	});

	let server = undefined;
	let token = undefined;

	loadSessionKeys();

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
					socket.emit('init-session', {
						status: true,
						key: sessionKeys.client.public
					});
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
			socket.on('init-session', (data) => {
				loadEncryptionObjects(data.key);
			});
		
			ipcRenderer.on('start', (event, data) => {
				if (data.room !== room || data.uid !== uid) ipcRenderer.send('close');
			});

			$('#send_message_form').submit((e) => {
				e.preventDefault();
				const msg = $('#send_message').val();
				if (!msg) return;

				const data = pack({
					message: msg,
					uid,
					room,
				});
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
				const decrypted = JSON.parse(unpack(data));
				$('#chat-messages').append($('<p style="white-space: pre-line">').text(`${decrypted.username}:\n${decrypted.message}`));
				$('#chat').animate({ scrollTop: $('#chat').prop('scrollHeight') });
				if (data.uid !== uid) {
					const audio = new Audio('../sounds/message.mp3');
					audio.play();
					const myNotification = new Notification(decrypted.username, {
						body: decrypted.message,
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