/* eslint-disable no-undef */
(() => {
	const electron = require('electron');
	const ipcRenderer = electron.ipcRenderer;
	ipcRenderer.on('alert', function(event, data) {
		alert(data);
	});
})();