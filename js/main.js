$(function() {
	const { ipcRenderer } = require('electron');
	const { sessionKeys, loadEncryptionObjects, generateSessionKeys, pack, unpack } = require('../js/crypt.js');
	const SaveData = require('../js/SaveData.js');
	const currentData = new SaveData({
		configName: 'current',
	});

	let token, uid, room, server;

	ipcRenderer.on('start', (event, data) => {
		token = data.token;
		uid = data.uid;
		room = data.room;
	});

	const getPrevious = setInterval(() => {
		if (!server) {
			server = currentData.get('server');
		} else {
			generateSessionKeys();
			ipcRenderer.send('log', 'Generated key');
			
			document.getElementById('chat-errors').innerHTML = 'Connecting to the server';
			let socket = io(server);

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
				error(false, 'Connected to the server');
			});

			socket.on('disconnect', () => {
				error(true, 'Disconnected from server, please restart Chattin!');
			});
			socket.on('connect_failed', () => {
				error(true, 'Disconnected from server, please restart Chattin!');
			});
			socket.on('connect_error', () => {
				error(true, 'Disconnected from server, please restart Chattin!');
			});
			socket.on('slowmode', (data, timeout) => {
				const decrypted = JSON.parse(unpack(data));
				$('#send_message').css('border-color', 'red');
				$('#send_message').val(decrypted.message);
				setTimeout(() => {
					$('#send_message').css('border-color', 'black');
				}, timeout);
			});
			socket.on('init-session', (data) => {
				loadEncryptionObjects(data.key);
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

			socket.emit('authenticate', { token });
			token = null;

			clearInterval(getPrevious);
		}
	}, 500)
});

const error = (errorBool, msg) => {
	if(errorBool) {
		ipcRenderer.send('log', msg);
		$('#chat-errors').text(msg);
		$('#send_message').prop('placeholder', msg);
		$('#send_message').prop('disabled', true);
	} else {
		ipcRenderer.send('log', msg);
		$('#chat-errors').text('');
		$('#send_message').prop('placeholder', 'Send a message.');
		$('#send_message').prop('disabled', false);
	}
}