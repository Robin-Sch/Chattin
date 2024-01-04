const electron = require('electron');
const path = require('path');
const fs = require('fs');
const { app, ipcRenderer } = require('electron');

class SaveData {
	constructor(opts) {
		if (!app) {
			ipcRenderer.send('getPath', 'userData');
			ipcRenderer.on('getPath', (event, data) => {
				this.path = path.join(data, opts.configName + '.json');
				this.data = parseDataFile(this.path, opts.defaults);
			});
		} else {
			const userDataPath = app.getPath('userData');
			this.path = path.join(userDataPath, opts.configName + '.json');
			this.data = parseDataFile(this.path, opts.defaults);
		}
	}

	get(key) {
		if(!this.data) return null;
		return this.data[key];
	}

	set(key, val) {
		if(!this.data) this.data = {};
		this.data[key] = val;
		fs.writeFileSync(this.path, JSON.stringify(this.data));
	}
}

const parseDataFile = (filePath, defaults) => {
	try {
		return JSON.parse(fs.readFileSync(filePath));
	} catch(error) {
		return defaults;
	}
}

module.exports = SaveData;