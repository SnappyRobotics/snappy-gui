"use strict";

const {
  app
} = require('electron')

const fs = require('fs')
const path = require('path')
const userhome = require('userhome')
const nodeCleanup = require('node-cleanup')

const debug = require('debug')("snappy:gui:index")

global.snappy_gui = {}

//--------------------------------SETTINGS--------------------------------

global.snappy_gui.client_PORT = 8895
global.snappy_gui.consts = {}
global.snappy_gui.consts.configFile = userhome(".snappy-gui", "config.json")
//------------------------------------------------------------------------


try {
  global.snappy_gui.config = JSON.parse(fs.readFileSync(global.snappy_gui.consts.configFile))

} catch (e) {
  console.error("No Config File exists in userDir");
  var ob = {}

  global.snappy_gui.config = ob

  fs.mkdirSync(userhome(".snappy-gui"))

  fs.writeFileSync(global.snappy_gui.consts.configFile, JSON.stringify(ob))
}

global.snappy_gui.saveConfig = function() {
  fs.writeFileSync(global.snappy_gui.consts.configFile, JSON.stringify(global.snappy_gui.config))
}

global.snappy_gui.package = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json")))
debug("=======================================================================")
debug("\t\t\t\t\t" + global.snappy_gui.package.name)
debug("\t\t\t\t    " + global.snappy_gui.package.description)
debug("\t\t\t\t\t" + global.snappy_gui.package.version)
debug("=======================================================================")


global.snappy_gui.app = app
global.snappy_gui.discovery = require(path.join(__dirname, 'scripts', 'discovery'))
global.snappy_gui.mainWindow = require(path.join(__dirname, 'scripts', 'mainWindow'))
global.snappy_gui.UIWindow = require(path.join(__dirname, 'scripts', 'UIWindow'))

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
}

function stopCore(f) {
  if (global.snappy_gui.core && global.snappy_gui.core.isRunning()) {
    global.snappy_gui.core.stop().then(function() {
      if (f) {
        f()
      }
    })
  }
}

global.snappy_gui.quit = function() {
  debug("quitting")
  if (process.platform !== 'darwin') {
    stopCore()
    app.quit()
  }
}

nodeCleanup(function(exitCode, signal) {
  if (signal) {
    stopCore(function() {
      debug("Stopped App")
      process.kill(process.pid, signal);
    })
    nodeCleanup.uninstall();
    return false;
  }
})
