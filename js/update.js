/* eslint-disable no-undef */
(() => {
	const electron = require('electron');
	const ipcRenderer = electron.ipcRenderer;
	ipcRenderer.on('alert', (event, data) => {
		alert(data);
	});
})();