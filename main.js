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

const launchers = require(path.join(__dirname, 'scripts', 'launchers'))

launchers.init()

/*
function createWindow(title, file, width, height) {
  var win = new BrowserWindow({
    name: title,
    title: title,
    frame: true,
    resizable: true,
    width: width,
    height: height,
    show: false
  })

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'renderer', file),
    protocol: 'file:',
    slashes: true
  }))

  // Chrome developer tools
  // win.webContents.openDevTools({
  //   // detach: true
  // });

  win.on('closed', () => {
    win = null
  })

  return win
}

function createLaunch() {
  launchWin = createWindow("Discovery", "discovery.html", 600, 400)
  const discover = require(path.join(__dirname, "main_process", 'discover'));
  launchWin.webContents.on('did-finish-load', function() {
    setTimeout(function() {
      launchWin.show();
      // console.error(Date.now());
    }, 40);
  });
}

app.on('ready', createLaunch)
app.on('activate', () => {
  if (launchWin === null) {
    createLaunch()
  }
})


ipcMain.on('start_core', function(event, arg) {
  global.snappy_gui.core = require('snappy-core')
  //global.snappy_gui.core.then(function () {
  setTimeout(function() {
    debug("Calling connect core to local core")
    ipcMain.emit("connect_core", "127.0.0.1")
  }, 100)
  //})
})

ipcMain.on('connect_core', function(event, arg) {
  global.snappy_gui.client_IP = arg
  progress = createWindow("Loading", "progress.html", 150, 100)
  setTimeout(function() {
    progress.show();
    launchWin.close()
  }, 50)
})
*/
