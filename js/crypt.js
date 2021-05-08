const md5 = require('./lib/md5.min.js');
const aesjs = require('aes-js');

let SECURITY_LEVEL = 2048;

if ((window.navigator.userAgent.indexOf('MSIE') > 0) ||
    (window.navigator.userAgent.indexOf('Trident/7') > 0) ||
    (window.navigator.userAgent.indexOf('Edge/') > 0)) {
	SECURITY_LEVEL = 1024;
}

let sessionKeys = {
	client: {},
	server: {},
};

let encrypter, decrypter;

function generateRandomString(length) {
	let text = '';
	const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < length; i++) {
		text += charset.charAt(Math.floor(Math.random() * charset.length));
	}
	return text;
}

function generateSessionKeys() {
	console.log('generating ' + SECURITY_LEVEL + '-bit key pair...');
	const crypt = new JSEncrypt({ default_key_size: SECURITY_LEVEL });
	let dt = new Date();
	let time = -(dt.getTime());
	crypt.getKey();
	dt = new Date();
	time += (dt.getTime());
	console.log('Keys Generated in ' + time + ' ms');

	sessionKeys.client = {
		'private': crypt.getPrivateKey(),
		'public': crypt.getPublicKey(),
	};
}

function loadEncryptionObjects(serverPublicKey) {
	sessionKeys.server.public = serverPublicKey;

	if (typeof (Storage) !== 'undefined') {
		sessionStorage.RSAKeys = JSON.stringify(sessionKeys);
		console.log('session key stored: ' + sessionStorage.RSAKeys);
	}

	encrypter = new JSEncrypt();
	encrypter.setKey(sessionKeys.server.public);

	decrypter = new JSEncrypt();
	decrypter.setKey(sessionKeys.client.private);
}

function loadSessionKeys() {
	if (typeof (Storage) !== 'undefined') {
		if (sessionStorage.RSAKeys) {
			sessionKeys = JSON.parse(sessionStorage.RSAKeys);
			console.log('client keys loaded from session storage');
		} else {
			generateSessionKeys();
			sessionStorage.RSAKeys = JSON.stringify(sessionKeys);
			console.log('session keys saved to storage');
		}
	} else {
		console.log('Sorry! No Web Storage support..');
	}
}

const aes = {
	encrypt: function(secret, text) {
		const secretHash = md5(secret);
		const key = aesjs.utils.utf8.toBytes(secretHash);
		const textBytes = aesjs.utils.utf8.toBytes(text);
		const aesCtr = new aesjs.ModeOfOperation.ctr(key);
		const encryptedBytes = aesCtr.encrypt(textBytes);
		return encryptedBytes;
	},

	decrypt: function(secret, encryptedBytes) {
		const encryptedData = [];
		const keys = Object.keys(encryptedBytes);
		for (let i = 0; i < keys.length; i++) {
			encryptedData[i] = encryptedBytes[keys[i]];
		}
		const secretHash = md5(secret);
		const key = aesjs.utils.utf8.toBytes(secretHash);
		const aesCtr = new aesjs.ModeOfOperation.ctr(key);
		const decryptedBytes = aesCtr.decrypt(encryptedData);
		return aesjs.utils.utf8.fromBytes(decryptedBytes);
	},

	generateKey: function() {
		return generateRandomString(32);
	},
};

function pack(data) {
	const packedData = {};
	const aesKey = aes.generateKey();
	try {
		packedData.key = encrypter.encrypt(aesKey);
		packedData.encrypted = aes.encrypt(aesKey, JSON.stringify(data));
		return packedData;
	} catch (dataEncryptionException) {
		console.log('failed to pack message: ' + dataEncryptionException.message);
		return {};
	}
}

function unpack(data) {
	const aesKey = decrypter.decrypt(data.key);
	console.log(aes.decrypt(aesKey, data.encrypted))
	return aes.decrypt(aesKey, data.encrypted);
}

module.exports = {
	sessionKeys,
	loadEncryptionObjects,
	loadSessionKeys,
	pack,
	unpack,
}