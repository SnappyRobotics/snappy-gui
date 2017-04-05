"use strict";

const {
  app
} = require('electron')

const fs = require('fs')
const path = require('path')

const debug = require('debug')("snappy:gui:index")

global.snappy_gui = {}

//--------------------------------SETTINGS--------------------------------

global.snappy_gui.client_PORT = 8000
//------------------------------------------------------------------------


try {
  global.snappy_gui.config = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "config.json")))

} catch (e) {
  console.error("No Config File exists in userDir");
  var ob = {}

  global.snappy_gui.config = ob

  fs.writeFileSync(path.join(__dirname, '..', 'userDir', "config.json"), JSON.stringify(ob))
}

global.snappy_gui.package = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "package.json")))
debug("=======================================================================")
debug("\t\t\t\t\t" + global.snappy_gui.package.name)
debug("\t\t\t\t    " + global.snappy_gui.package.description)
debug("\t\t\t\t\t" + global.snappy_gui.package.version)
debug("=======================================================================")


global.snappy_gui.app = app
global.snappy_gui.discovery = require(path.join(__dirname, 'scripts', 'discovery'))
global.snappy_gui.mainWindow = require(path.join(__dirname, 'scripts', 'mainWindow'))

//=============================================================================


if (process.env.WINDOW) {
  global.snappy_gui.window = process.env.WINDOW
}

if (process.env.NODE_ENV != 'test') {
  global.snappy_gui.window = ['discovery', 'mainWindow'][0]
} else {
  if (process.env.TEST_MODE && process.env.TEST_MODE == 'GUI') {
    require(path.join(__dirname, 'test', 'gui', global.snappy_gui.window + '_nocks.js'));
  }
}

if (global.snappy_gui.window) {
  app.on('activate', () => {
    if (!global.snappy_gui[global.snappy_gui.window].win) {
      global.snappy_gui[global.snappy_gui.window].createWindow()
    }
  });

  app.on('ready', () => {
    global.snappy_gui[global.snappy_gui.window].createWindow()
  });

  global.snappy_gui.quit = function() {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  }
}
