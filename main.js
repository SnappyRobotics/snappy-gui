"use strict";

const {
  app,
  dialog,
  ipcMain,
  BrowserWindow
} = require('electron')

const fs = require('fs')
const path = require('path')

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


global.snappy_gui.app = app
global.snappy_gui.discovery = require(path.join(__dirname, 'scripts', 'discovery'))
global.snappy_gui.mainWindow = require(path.join(__dirname, 'scripts', 'mainWindow'))

//===============================================================================

app.on('activate', () => {
  if (!global.snappy_gui.discovery.win) {
    global.snappy_gui.discovery.createWindow()
  }
});

app.on('ready', () => {
  global.snappy_gui.discovery.createWindow()
});

global.snappy_gui.quit = function() {
  if (process.platform !== 'darwin') {
    app.quit()
  }
}
