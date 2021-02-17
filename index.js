const servers = [
	'http://142.54.191.92:1846',
];
let currentServer = servers[0];
const electron = require('electron');
const url = require('url');
const path = require('path');
const log = require('electron-log');
const autoUpdater = require('electron-updater').autoUpdater;

const { app, BrowserWindow, Menu, ipcMain } = electron;
const SaveData = require('./js/SaveData.js');
const currentData = new SaveData({
	configName: 'current',
});

if(app.isPackaged) {
	currentData.set('server', currentServer);
} else {
	currentServer = 'http://localhost:3000';
	currentData.set('server', currentServer);
}

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

let mainWindow;
let loginWindow;
let currentWindow;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock && app.isPackaged) {
	app.quit();
} else {
	app.on('second-instance', () => {
		if (currentWindow) {
			if (currentWindow.isMinimized()) currentWindow.restore();
			currentWindow.focus();
		}
	});

	app.on('ready', function() {
		loginWindow = new BrowserWindow({ minWidth: 400, minHeight: 400, icon: __dirname + '/build/icon.png', webPreferences: { nodeIntegration: true } });
		loginWindow.loadURL(url.format({
			pathname: path.join(__dirname, '/html/login.html'),
			protocol: 'file:',
			slashes: true,
		}));
		loginWindow.on('closed', function() {
			loginWindow = null;
		});
		const loginMenu = Menu.buildFromTemplate(loginMenuTemplate);
		Menu.setApplicationMenu(loginMenu);
		currentWindow = loginWindow;

		if(app.isPackaged) {
			log.info('starting update check');
			autoUpdater.checkForUpdates();
		} else {
			currentWindow.webContents.openDevTools();
		}

	});


	// Menu options bar
	const mainMenuTemplate = [];
	const loginMenuTemplate = [];

	ipcMain.on('open:index', function(event, data) {
		mainWindow = new BrowserWindow({ show: false, minWidth: 400, minHeight: 400, icon: __dirname + '/build/icon.png', webPreferences: { nodeIntegration: true } });
		if(!app.isPackaged) mainWindow.webContents.openDevTools();
		mainWindow.maximize();
		mainWindow.show();
		mainWindow.loadURL(url.format({
			pathname: path.join(__dirname, '/html/index.html'),
			protocol: 'file:',
			slashes: true,
		}));
		mainWindow.on('closed', function() {
			app.quit();
		});
		const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
		Menu.setApplicationMenu(mainMenu);
		currentWindow = mainWindow;

		mainWindow.webContents.once('dom-ready', () => {
			mainWindow.show();
			mainWindow.webContents.send('start', data);
		});

		if (loginWindow) loginWindow.close();
	});

	ipcMain.on('close', function() {
		currentWindow.close();
	});

	ipcMain.on('focus', function() {
		if (currentWindow.isMinimized()) currentWindow.restore();
		currentWindow.focus();
	});

	ipcMain.on('newServer', function(event, data) {
		let index = servers.indexOf(currentServer);
		index += 1;
		if (index >= servers.length) index = 0;
		currentServer = servers[index];
		log.info('reconnect', `Reconnecting to ${currentServer}`);
		currentData.set('server', currentServer);
		currentWindow.webContents.send('newServer', { server: currentServer, data });
	});

	// If mac, add empty object to menu
	if(process.platform == 'darwin') {
		mainMenuTemplate.unshift({});
	}

	// -------------------------------------------------------------------
	// Auto updates
	// -------------------------------------------------------------------
	autoUpdater.on('checking-for-update', () => {
	// if (currentWindow) currentWindow.webContents.send('alert', 'Checking for updates');
	});
	autoUpdater.on('update-available', (ev, info) => {
		if (currentWindow) currentWindow.webContents.send('alert', 'Download new update!');
		if (info) log.info('update-available info', info);
	});
	autoUpdater.on('update-not-available', (ev, info) => {
	// if (currentWindow) currentWindow.webContents.send('alert', 'Update not available');
		if (info) log.info('update-not-available info', info);
	});
	autoUpdater.on('error', (ev, err) => {
		if (currentWindow) currentWindow.webContents.send('alert', 'Error in auto updater!');
		if (err) log.info('update-error error', err);
	});
	autoUpdater.on('update-downloaded', (ev, info) => {
		if (currentWindow) currentWindow.webContents.send('alert', 'Restarting in 3 seconds for update!');
		if (info) log.info('update-download info', info);
		setTimeout(() => {
			autoUpdater.quitAndInstall();
		}, 3000);
	});
}