"use strict";

const {
  app,
  ipcMain,
  BrowserWindow
} = require('electron')

const path = require('path')
const url = require('url')
const fs = require('fs')
const discovery = require(path.join(__dirname, 'scripts', 'discovery'))

const debug = require('debug')("snappy:gui:index")

//--------------------------------SETTINGS--------------------------------

global.snappy_gui.client_PORT = 8000

//------------------------------------------------------------------------

global.snappy_gui.package = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json")))
debug("==========================================================================")
debug("\t\t\t\t\t" + global.snappy_gui.package.name)
debug("\t\t\t\t    " + global.snappy_gui.package.description)
debug("\t\t\t\t\t" + global.snappy_gui.package.version)
debug("==========================================================================")




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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

let launchWin

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
  global.core = require('snappy-core');
})
