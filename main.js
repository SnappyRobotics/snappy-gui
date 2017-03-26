"use strict";

const path = require('path')

const fs = require('fs')

const debug = require('debug')("snappy:gui:index")

global.snappy_gui = {}

//--------------------------------SETTINGS--------------------------------

global.snappy_gui.client_PORT = 8000
//------------------------------------------------------------------------

global.snappy_gui.package = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json")))
debug("==========================================================================")
debug("\t\t\t\t\t" + global.snappy_gui.package.name)
debug("\t\t\t\t    " + global.snappy_gui.package.description)
debug("\t\t\t\t\t" + global.snappy_gui.package.version)
debug("==========================================================================")

debug(require('electron'))
/*global.snappy_gui.app = require('electron-prebuilt').app;
global.snappy_gui.ipcMain = require('electron').ipcMain;
global.snappy_gui.BrowserWindow = require('electron').BrowserWindow;
*/
/*
debug(require('module').globalPaths);
debug(require("electron"));

const app = require("electron").app;

debug(app)

if (!app) {
  debug("No app found")
  const app = require('app');

  debug(app);
}

debug(app);
//debug(require('app'));
*/
//const launchers = require(path.join(__dirname, 'scripts', 'launchers'))

//launchers.init()
